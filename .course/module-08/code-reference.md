# Module 08: Camera Input

## Overview

Add camera input functionality to enable multimodal interactions. You will integrate a camera component, manage camera state, and send captured images to the realtime session.

## File: `src/components/realtime/RealtimeChat.tsx`

### 1. Import Camera Components

**Context:** Imports.
**Action:** Import `Camera` icon and `CameraCapture` component.
**Code:**

```typescript
import { Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
```

### 2. Add isCameraOpen State

**Context:** Component state.
**Action:** Add state for camera visibility.
**Code:**

```typescript
const [isCameraOpen, setIsCameraOpen] = useState(false);
```

### 3. Close Camera on Disconnect

**Context:** `handleConnectToggle` function.
**Action:** Reset camera state on disconnect.
**Code:**

```typescript
const handleConnectToggle = () => {
  if (isConnected) {
    disconnect();
    setIsCameraOpen(false);
  } else {
    void connect();
  }
};
```

### 4. Render CameraCapture Component

**Context:** JSX, inside the chat card (before `MessageInput`).
**Action:** Conditionally render the camera component.
**Code:**

```tsx
{
  isCameraOpen && (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <CameraCapture
        disabled={!isConnected}
        onCapture={(dataUrl) => {
          if (!sessionRef.current) return;
          sessionRef.current.addImage(dataUrl, {
            triggerResponse: false,
          });
        }}
      />
    </div>
  );
}
```

### 5. Add Camera Toggle Button

**Context:** JSX, button group (after Interrupt button).
**Action:** Add button to toggle camera.
**Code:**

```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => setIsCameraOpen((value) => !value)}
  disabled={!isConnected}
  className="gap-2"
>
  <Camera size={16} />
  {isCameraOpen ? "Hide camera" : "Camera"}
</Button>
```

## Verification

- [ ] Camera button appears and toggles the camera view.
- [ ] Capturing an image adds it to the session (no immediate response).
- [ ] Asking "What is in this image?" triggers a description from the agent.
