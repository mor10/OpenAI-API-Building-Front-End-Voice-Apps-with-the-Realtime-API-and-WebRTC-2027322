# Module 08: Camera Input

## Learning Objectives

- Integrate camera input for multimodal interactions.
- Capture still images from the browser camera.
- Attach captured frames to the realtime session.
- Manage camera state and UI visibility.

## Time Estimate

30–45 minutes

## Prerequisites

- Lessons 01–07 completed.

## Steps

1. Import `Camera` icon and `CameraCapture` component in `src/components/realtime/RealtimeChat.tsx`.
2. Add `isCameraOpen` state to control camera visibility.
3. Update `handleConnectToggle` to close camera on disconnect.
4. Render `CameraCapture` component conditionally when camera is open.
5. Add camera toggle button to enable/disable camera view.
6. Configure `onCapture` handler to add images to session without triggering immediate responses.

## Key Concepts

- Multimodal interactions combine text, voice, and visual input.
- Camera capture uses browser's `navigator.mediaDevices` API.
- Images are added to session context for future queries.
- `triggerResponse: false` prevents automatic responses on image capture.

## Implementation Guide

The existing `CameraCapture` component handles camera stream management, preview display, and image capture. The `useCamera` hook manages capability detection and cleanup. Images are captured as data URLs and added to the session context using `sessionRef.current.addImage()`.

## Verification

- Camera button appears and toggles the camera view.
- Capturing an image adds it to the session (no immediate response).
- Asking "What is in this image?" triggers a description from the agent.

## !!!AI INSTRUCTIONS!!!

- See `08-code-reference.md` for code snippets and structure to follow.
