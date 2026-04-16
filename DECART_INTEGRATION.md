# Decart Lucy VTON Integration Guide

This document serves as the single reference for integrating the Decart Lucy VTON API into the ST/ST Virtual Try-On app. All code examples are production-ready patterns.

---

## 1. SDK setup

### Installation

```bash
npm install @decartai/sdk
```

### Model constants

```typescript
import { models } from "@decartai/sdk";

// VTON-specific model — NOT the generic lucy-2
export const VTON_MODEL = models.realtime("lucy-vton-latest");

// Model specs (provided by SDK):
// VTON_MODEL.fps    → 25
// VTON_MODEL.width  → 1280
// VTON_MODEL.height → 720 (was 704 for lucy-2, VTON uses 720)
```

### Available VTON endpoints

| Version | WebSocket URL | Notes |
|---|---|---|
| v2.1-vton | `wss://api3.decart.ai/v1/stream?model=lucy-2.1-vton` | **Recommended** — latest VTON model |

---

## 2. Client token flow (production)

### Backend: create token

```typescript
// src/app/api/vto/token/route.ts

import { createDecartClient } from "@decartai/sdk";
import { NextResponse } from "next/server";

const serverClient = createDecartClient({
  apiKey: process.env.DECART_API_KEY!, // sk-... (server-side only)
});

export async function POST() {
  try {
    const token = await serverClient.tokens.create();
    // Returns: { apiKey: "ek_...", expiresAt: "2026-..." }
    return NextResponse.json(token);
  } catch (error) {
    console.error("Token creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create session token" },
      { status: 500 }
    );
  }
}
```

### Frontend: fetch and use token

```typescript
// src/hooks/useClientToken.ts

export async function fetchClientToken(): Promise<string> {
  const res = await fetch("/api/vto/token", { method: "POST" });
  if (!res.ok) throw new Error("Token request failed");
  const { apiKey } = await res.json();
  return apiKey; // "ek_..."
}
```

**Token rules:**
- TTL: 10 minutes
- Create a new token each time a user opens a try-on session
- Active WebRTC sessions continue working after token expiry
- Do not persist tokens in localStorage
- Never expose `sk-…` keys to the client

---

## 3. Connection lifecycle

### Full connection flow

```typescript
import { createDecartClient, models, type DecartSDKError } from "@decartai/sdk";

const model = models.realtime("lucy-vton-latest");

async function startSession(apiKey: string) {
  // 1. Get camera stream matching model specs
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      frameRate: { ideal: model.fps },
      width: { ideal: model.width },
      height: { ideal: model.height },
    },
  });

  // 2. Create client with ephemeral token
  const client = createDecartClient({ apiKey });

  // 3. Connect to VTON model
  const realtimeClient = await client.realtime.connect(stream, {
    model,
    onRemoteStream: (editedStream) => {
      // Attach transformed stream to output video element
      const output = document.getElementById("output") as HTMLVideoElement;
      output.srcObject = editedStream;
    },
  });

  // 4. Register event handlers
  realtimeClient.on("connectionChange", (state) => {
    // "connecting" | "connected" | "generating" | "reconnecting" | "disconnected"
    updateStatusUI(state);
  });

  realtimeClient.on("error", (error: DecartSDKError) => {
    console.error(`[${error.code}] ${error.message}`);
    handleError(error);
  });

  realtimeClient.on("generationTick", ({ seconds }) => {
    updateTimer(seconds);
  });

  return { realtimeClient, stream };
}
```

### Cleanup

```typescript
function endSession(realtimeClient: RealtimeClient, stream: MediaStream) {
  // 1. Disconnect from Decart
  realtimeClient.disconnect();

  // 2. Remove event listeners
  realtimeClient.off("connectionChange", onConnectionChange);
  realtimeClient.off("error", onError);
  realtimeClient.off("generationTick", onTick);

  // 3. Stop camera
  stream.getTracks().forEach((track) => track.stop());
}

// Always cleanup on page unload
window.addEventListener("beforeunload", () => endSession(rc, stream));

// In React:
useEffect(() => {
  return () => endSession(rc, stream);
}, []);
```

---

## 4. Outfit control

### Apply garment with reference image + prompt (best quality)

```typescript
// When user selects a product from the catalogue
await realtimeClient.set({
  prompt: "Substitute the current top with a french navy crew neck t-shirt with a regular fit and short sleeves, made from organic ring-spun cotton",
  image: garmentImageFile,  // File object from catalogue or upload
  enhance: false,           // We provide detailed prompt, no auto-enhance
});
```

### Apply garment with reference image only

```typescript
// When user uploads an image without writing a prompt
await realtimeClient.set({
  image: garmentImageFile,
});
```

### Apply garment with prompt only (no reference image)

```typescript
// When no garment image is available
await realtimeClient.set({
  prompt: "Substitute the current top with a bright red hoodie with an oversized casual fit",
  enhance: true,  // Let Decart enhance the short prompt
});
```

### Switch outfits during live session

```typescript
// NO RECONNECTION NEEDED — just call set() again
await realtimeClient.set({
  prompt: "Substitute the current top with a desert dust polo shirt with a slim fit",
  image: newGarmentImage,
  enhance: false,
});
```

**Critical: `set()` replaces the entire state.** Fields you omit are cleared. Always include every field you want to keep.

---

## 5. Prompt engineering for VTON

### Prompt patterns

| Pattern | When to use | Example |
|---|---|---|
| **Substitute** | Replace an existing garment | `"Substitute the current top with a red plaid flannel shirt with a relaxed fit"` |
| **Add** | Add something not worn | `"Add a wide-brimmed straw hat to the person's head"` |

### Prompt template for ST/ST products

```typescript
function buildVtonPrompt(product: Product, color: ColorVariant): string {
  const colorName = color.name.toLowerCase();

  // Target 20-30 words
  return `Substitute the current top with a ${colorName} ${product.description}`;
}

// Examples of product.description values:
// "crew neck t-shirt with a regular fit and short sleeves"
// "pullover hoodie with a kangaroo pocket and drawstring hood, relaxed fit"
// "zip-up bomber jacket with ribbed cuffs and hem, regular fit"
// "polo shirt with a button placket and flat-knit collar, slim fit"
```

### Prompt quality checklist

- ✅ Starts with "Substitute the current top/bottoms with..." or "Add ... to the person's..."
- ✅ Includes color
- ✅ Includes garment type (t-shirt, hoodie, jacket)
- ✅ Includes fit (regular, relaxed, slim, boxy, oversized)
- ✅ Includes visible design details (collar type, pocket, ribbed cuffs)
- ✅ 20–30 words total
- ✅ One garment per prompt
- ❌ Never mention material unless it's visually obvious (e.g. denim, fleece, corduroy)
- ❌ Never mention certifications or sustainability in the prompt (irrelevant to visual output)

### Prompt debouncing

```typescript
let debounceTimer: ReturnType<typeof setTimeout>;

function onPromptChange(text: string) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (isConnected) {
      realtimeClient.set({
        prompt: text,
        image: currentGarmentImage,
        enhance: text.split(" ").length < 10,  // auto-enhance short prompts
      });
    }
  }, 400);
}
```

---

## 6. Reference image guidelines

For best VTON results, garment reference images should be:

| Criterion | Requirement |
|---|---|
| **Subject** | Just the clothing item — no person wearing it |
| **Background** | White or plain, uniform background |
| **Resolution** | At least 512 × 512 px |
| **Format** | JPEG, PNG, or WebP |
| **Lighting** | Even, neutral lighting — no harsh shadows |
| **Orientation** | Garment laid flat or on invisible mannequin, front-facing |
| **Cropping** | Garment fills most of the frame with small margin |

If source images show a person wearing the garment (e.g. from ST/ST lookbook), consider pre-processing with an image editing model to extract just the clothing item on a white background.

---

## 7. Error handling

### Error codes from Decart SDK

```typescript
realtimeClient.on("error", (error: DecartSDKError) => {
  switch (error.code) {
    case "INVALID_API_KEY":
      // Token expired or invalid → request new token
      refreshToken();
      break;
    case "WEB_RTC_ERROR":
      // Network issue → SDK auto-reconnects (5 retries)
      showReconnectingBanner();
      break;
    case "MODEL_NOT_FOUND":
      // Model unavailable → show maintenance message
      showMaintenanceMessage();
      break;
    default:
      showGenericError(error.message);
  }
});
```

### Browser-level errors

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
} catch (error) {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        showPermissionDeniedUI();
        break;
      case "NotFoundError":
        showNoCameraUI();
        break;
      case "NotReadableError":
        showCameraInUseUI();
        break;
      case "OverconstrainedError":
        // Fall back to less strict constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },  // No resolution constraints
        });
        break;
    }
  }
}
```

### Auto-reconnect behavior

The SDK handles reconnection automatically:
1. Connection drops → state moves to `"reconnecting"`
2. SDK retries with exponential backoff (up to 5 times)
3. Success → state moves to `"generating"`
4. All retries fail → state moves to `"disconnected"` + `error` event

Your app just needs to update the UI to reflect the current state.

---

## 8. Connection state machine

```
                ┌──────────────┐
                │     idle     │
                └──────┬───────┘
                       │ start()
                       ▼
                ┌──────────────┐
           ┌───►│  connecting  │
           │    └──────┬───────┘
           │           │ WebRTC established
           │           ▼
           │    ┌──────────────┐
           │    │  connected   │
           │    └──────┬───────┘
           │           │ first frame received
           │           ▼
           │    ┌──────────────┐    set({prompt, image})
           │    │  generating  │◄──────────────────────
           │    └──────┬───────┘
           │           │ connection drop
           │           ▼
           │    ┌──────────────┐
           └────┤ reconnecting │ (SDK: 5 retries, exponential backoff)
                └──────┬───────┘
                       │ all retries failed
                       ▼
                ┌──────────────┐
                │ disconnected │
                └──────┬───────┘
                       │ user clicks Start again
                       ▼
                    (back to idle)
```

---

## 9. Pricing reference

| Resource | Cost |
|---|---|
| VTON model (720p) | 2 credits / second |
| Estimated cost per 5-min session | 600 credits |
| Estimated cost per hour | 7,200 credits |

Check current pricing at https://docs.platform.decart.ai/getting-started/pricing

---

## 10. Useful links

| Resource | URL |
|---|---|
| Decart Platform | https://platform.decart.ai |
| VTON Documentation | https://docs.platform.decart.ai/models/realtime/virtual-try-on |
| JS SDK (npm) | https://www.npmjs.com/package/@decartai/sdk |
| SDK GitHub | https://github.com/DecartAI/sdk |
| Try-On Examples | https://github.com/DecartAI/tryon-examples |
| Streaming Best Practices | https://docs.platform.decart.ai/models/realtime/streaming-best-practices |
| Client Tokens | https://docs.platform.decart.ai/getting-started/client-tokens |
| Decart Cookbook | https://cookbook.decart.ai |
| API Status | https://status.decart.ai |
