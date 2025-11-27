"use client";

import Image from "next/image";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

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
    <div
      className={`flex flex-col items-end gap-2 p-2 rounded-md ${className}`}
    >
      <video
        ref={videoRef}
        className={`w-56 h-auto rounded-md border border-gray-300 shadow bg-black ${
          isActive ? "block" : "hidden"
        }`}
        muted
        autoPlay
      />
      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}
      {isActive ? (
        <div className="flex gap-2">
          <Button
            onClick={handleCapture}
            variant="default"
            disabled={disabled || isCapturing}
          >
            {isCapturing ? "Capturing…" : "Capture"}
          </Button>
          <Button onClick={stop} variant="outline">
            Stop Camera
          </Button>
        </div>
      ) : (
        <Button onClick={start} variant="default" disabled={disabled}>
          Start Camera
        </Button>
      )}
      {lastPhoto && (
        <Image
          src={lastPhoto}
          alt="Last captured"
          width={160}
          height={160}
          unoptimized
          className="w-40 h-auto rounded-md border border-gray-300 shadow-md bg-white"
        />
      )}
    </div>
  );
}
