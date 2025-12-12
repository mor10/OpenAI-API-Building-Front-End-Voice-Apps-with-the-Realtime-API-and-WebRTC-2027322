"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

/**
 * CameraCapture keeps the entire camera lifecycle (start, capture, stop)
 * inside one file so students can see how MediaStream is managed.
 */
export function CameraCapture({
  onCapture,
  disabled = false,
  className = "",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return Boolean(navigator.mediaDevices?.getUserMedia);
  });

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError("Camera not supported in this environment.");
      return;
    }
    if (isActive) return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element not ready.");
      }

      video.srcObject = stream;
      video.playsInline = true;
      await video.play().catch(async () => {
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
      });
      setIsActive(true);
    } catch (err) {
      console.error("Failed to start camera", err);
      setError(err instanceof Error ? err.message : "Failed to start camera");
      stop();
    }
  }, [isActive, isSupported, stop]);

  const capture = useCallback(async () => {
    if (!videoRef.current) throw new Error("Video element not ready");
    if (!isActive) throw new Error("Camera not active");

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const targetWidth = 800;
      const vw = video.videoWidth || targetWidth;
      const vh = video.videoHeight || targetWidth;
      const scale = targetWidth / vw;
      const width = targetWidth;
      const height = Math.max(1, Math.round(vh * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setLastPhoto(dataUrl);
      return dataUrl;
    } finally {
      setIsCapturing(false);
    }
  }, [isActive]);

  const handleCapture = useCallback(async () => {
    try {
      const dataUrl = await capture();
      await onCapture(dataUrl);
    } catch (err) {
      console.error("Capture failed", err);
    }
  }, [capture, onCapture]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsSupported(Boolean(navigator.mediaDevices?.getUserMedia));
    }
  }, []);

  useEffect(() => stop, [stop]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <video
        ref={videoRef}
        className={`h-auto w-full max-w-md rounded-md border border-border bg-black shadow ${
          isActive ? "block" : "hidden"
        }`}
        muted
        autoPlay
        playsInline
      />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {isSupported ? (
        <div className="flex flex-wrap gap-2 text-sm">
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
            <Button onClick={start} variant="default" disabled={disabled} size="sm">
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
            alt="Last captured"
            className="h-auto w-full max-w-xs rounded-md border border-border bg-background shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
