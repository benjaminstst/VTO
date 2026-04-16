# Architecture — ST/ST Virtual Try-On

## 1. System overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                          │
│                                                                     │
│   ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐    │
│   │ Sidebar  │   │  Video Stage │   │   Decart JS SDK         │    │
│   │          │   │              │   │   (@decartai/sdk)        │    │
│   │ Products │   │ ┌──────────┐ │   │                         │    │
│   │ Colors   │   │ │ Camera   │ │   │  createDecartClient()   │    │
│   │ Prompt   │   │ │ (local)  │ │   │  client.realtime        │    │
│   │ Upload   │   │ └──────────┘ │   │    .connect(stream)     │    │
│   │ Controls │   │ ┌──────────┐ │   │  realtimeClient         │    │
│   │          │   │ │ Output   │◄├───┤    .set({prompt, image}) │    │
│   │          │   │ │ (remote) │ │   │    .disconnect()         │    │
│   └──────────┘   │ └──────────┘ │   └────────────┬────────────┘    │
│                  └──────────────┘                │                  │
│                                                   │ WebRTC          │
└───────────────────────────────────────────────────┼─────────────────┘
                                                    │
                ┌───────────────────────────────────┼───────┐
                │         Your Backend (Next.js)    │       │
                │                                   │       │
                │   POST /api/vto/token             │       │
                │   ┌─────────────────────┐         │       │
                │   │ client.tokens       │─────────┘       │
                │   │   .create()         │   (token used   │
                │   └──────────┬──────────┘    by frontend) │
                │              │                            │
                └──────────────┼────────────────────────────┘
                               │ HTTPS (server-side only)
                               ▼
                ┌──────────────────────────────────┐
                │        Decart API Platform       │
                │                                  │
                │   Token service                  │
                │   Lucy VTON inference (WebRTC)   │
                │   wss://api3.decart.ai/v1/stream │
                │                                  │
                └──────────────────────────────────┘
```

---

## 2. Data flow

### 2.1 Session initialization

```
User clicks "Start Try-On"
         │
         ▼
┌─ Frontend ───────────────────────────────────────────────────────────┐
│ 1. POST /api/vto/token                                              │
│    └─► Backend creates token via Decart SDK                         │
│    └─► Returns { apiKey: "ek_...", expiresAt: "..." }               │
│                                                                      │
│ 2. navigator.mediaDevices.getUserMedia({                             │
│      video: { frameRate: 25, width: 1280, height: 720 }             │
│    })                                                                │
│    └─► Stores stream, displays in local <video> element             │
│                                                                      │
│ 3. createDecartClient({ apiKey: "ek_..." })                         │
│                                                                      │
│ 4. client.realtime.connect(stream, {                                │
│      model: models.realtime("lucy-vton-latest"),                    │
│      onRemoteStream: (s) => outputVideo.srcObject = s               │
│    })                                                                │
│    └─► SDK establishes WebSocket + WebRTC peer connection            │
│    └─► Video frames start flowing to Decart inference server         │
│    └─► Transformed frames stream back via WebRTC                     │
│                                                                      │
│ 5. realtimeClient.set({                                              │
│      prompt: "Substitute the current top with ...",                  │
│      image: garmentFile,                                             │
│      enhance: false                                                  │
│    })                                                                │
│    └─► Lucy VTON starts transforming video with garment overlay      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Outfit change during live session

```
User selects new product + color
         │
         ▼
buildPrompt(product, color) → "Substitute the current top with..."
         │
         ▼
realtimeClient.set({
  prompt: newPrompt,
  image: product.garmentImageUrl,   // or uploaded file
  enhance: false
})
         │
         ▼
Lucy VTON updates transformation in real-time (no reconnection needed)
```

### 2.3 Session teardown

```
User clicks "Stop" or navigates away
         │
         ▼
realtimeClient.disconnect()         → Closes WebRTC connection
stream.getTracks().forEach(stop)     → Releases camera
outputVideo.srcObject = null         → Clears output
UI resets to idle state
```

---

## 3. Component architecture

```
<TryOnPage>
├── <Sidebar>
│   ├── <ApiKeyInput>              (dev mode only)
│   ├── <SegmentControl>           (category tabs)
│   ├── <SearchInput>              (product search)
│   ├── <ProductGrid>
│   │   └── <ProductCard> ×N
│   ├── <ColorPicker>
│   │   └── <ColorSwatch> ×N
│   ├── <GarmentUpload>
│   │   └── <UploadZone>
│   ├── <PromptEditor>
│   └── <SessionControls>
│       ├── <StatusPill>
│       ├── <Button> (Start/Stop)
│       └── <SessionTimer>
│
├── <VideoStage>
│   ├── <VideoBox label="You">
│   │   └── <video> (local camera)
│   └── <VideoBox label="Try-On">
│       ├── <video> (remote output)
│       └── <LiveBadge>
│
└── <ProductInfoBar>
    ├── Product name + style code
    ├── Color name
    ├── <CertBadge> ×N
    └── Material info
```

---

## 4. State management (Zustand)

```typescript
// src/stores/tryonStore.ts

interface TryOnState {
  // Product selection
  category: ProductCategory;
  selectedProduct: Product | null;
  selectedColor: ColorVariant | null;
  searchQuery: string;

  // Session
  status: ConnectionStatus;
  prompt: string;
  garmentFile: File | null;
  elapsedSeconds: number;
  error: string | null;

  // Dev
  devApiKey: string;

  // Actions
  setCategory: (cat: ProductCategory) => void;
  selectProduct: (product: Product) => void;
  selectColor: (color: ColorVariant) => void;
  setPrompt: (prompt: string) => void;
  setGarmentFile: (file: File | null) => void;
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  incrementTimer: () => void;
  resetSession: () => void;
}
```

State flow:
- Product selection → triggers prompt rebuild → if live, triggers `realtimeClient.set()`
- Color selection → triggers prompt rebuild → if live, triggers `realtimeClient.set()`
- Garment upload → clears product selection → if live, triggers `realtimeClient.set()`
- Session start → status: idle → connecting → live
- Session stop → status: live → idle, all streams released

---

## 5. API routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/vto/token` | Session cookie / JWT | Create Decart client token |

### Token endpoint contract

**Request:** No body required (user identity from session)

**Response (200):**
```json
{
  "apiKey": "ek_abc123...",
  "expiresAt": "2026-04-16T15:30:00Z"
}
```

**Response (401):** Unauthorized
**Response (429):** Rate limited
**Response (500):** Decart API error

---

## 6. Security considerations

| Concern | Mitigation |
|---|---|
| API key exposure | Client tokens only (`ek_…`); permanent key never leaves server |
| Token theft | 10-minute TTL; tokens scoped to session; HTTPS only |
| Camera privacy | Camera only activated on explicit user action; no recording; frames processed in real-time and discarded |
| CORS | Token endpoint restricted to same origin |
| CSP | Whitelist `wss://api3.decart.ai`, `stun:stun.l.google.com`, Decart SDK CDN |
| Rate limiting | 10 token requests / minute / user; optional session time cap |
| Input validation | Prompt length capped at 500 chars; file upload capped at 5 MB; image format validation |

---

## 7. Performance budget

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5 s |
| Largest Contentful Paint | < 2.5 s |
| Time to Interactive | < 3.0 s |
| JS bundle size (gzipped) | < 150 KB (excluding Decart SDK) |
| Camera → output latency | < 200 ms (app-side < 50 ms, rest is Decart) |
| Sidebar render (30 products) | < 100 ms |

---

## 8. Browser compatibility matrix

| Browser | Min version | WebRTC | getUserMedia | Notes |
|---|---|---|---|---|
| Chrome | 90+ | ✅ | ✅ | Primary target |
| Edge | 90+ | ✅ | ✅ | Chromium-based |
| Safari | 16+ | ✅ | ✅ | Requires HTTPS; may need `webkit` prefix for some APIs |
| Firefox | 100+ | ✅ | ✅ | VP8 preferred |
| Mobile Chrome | 90+ | ✅ | ✅ | Front/rear camera toggle |
| Mobile Safari | 16+ | ✅ | ✅ | Test `facingMode` |
