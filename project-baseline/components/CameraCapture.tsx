"use client";

import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

/**
 * CameraCapture
 * - Start/stop camera and show a live preview.
 * - Capture sends the current frame via onCapture, but does not auto-stop the camera.
 * - Shows the last captured photo preview.
 */
export function CameraCapture({
  onCapture,
  disabled = false,
  className = "",
}: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    isCapturing,
    lastPhoto,
    error,
    isSupported,
    start,
    stop,
    capture,
  } = useCamera();

  const handleCapture = useCallback(async () => {
    try {
      const dataUrl = await capture();
      await onCapture(dataUrl);
    } catch (e) {
      console.error("Capture failed", e);
    }
  }, [capture, onCapture]);

  return (
    <div className={"flex flex-col gap-3 " + (className ?? "")}>
      {/* Always render the video so the ref is ready when start() is called */}
      <video
        ref={videoRef}
        className={
          "w-full max-w-md h-auto rounded-md border border-border shadow bg-black " +
          (isActive ? "block" : "hidden")
        }
        muted
        autoPlay
        playsInline
      />

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {isSupported ? (
        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <>
              <Button
                onClick={handleCapture}
                variant="default"
                disabled={disabled || isCapturing}
                size="sm"
              >
                {isCapturing ? "Capturing…" : "Capture"}
              </Button>
              <Button onClick={stop} variant="outline" size="sm">
                Stop Camera
              </Button>
            </>
          ) : (
            <Button
              onClick={start}
              variant="default"
              disabled={disabled}
              size="sm"
            >
              Start Camera
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Camera access is not supported in this environment.
        </div>
      )}

      {lastPhoto && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last captured:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lastPhoto}
            alt="Last captured photo"
            className="w-full max-w-xs h-auto rounded-md border border-border shadow-sm bg-background"
          />
        </div>
      )}
    </div>
  );
}
