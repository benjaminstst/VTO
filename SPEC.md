# Stanley/Stella Virtual Try-On — Product Specification

## 1. Project overview

**Product name:** ST/ST Virtual Try-On
**Objective:** Build a web-based virtual try-on experience that lets visitors see themselves wearing Stanley/Stella garments in real-time, using the Decart Lucy VTON engine via WebRTC.
**Target deployment:** Embedded in the existing Stanley/Stella website (`stanleystella.com`), and usable as a standalone page at trade shows / showrooms.

### 1.1 Reference implementation

The UI and UX should be inspired by the current Stanley/Stella product catalog pages (clean, minimal, sustainability-forward aesthetic), but enhanced with a dual video pane showing the user's live camera feed alongside the AI-dressed output.

### 1.2 Core value proposition

- Visitors pick any garment + colorway from the ST/ST catalogue
- Their webcam captures a live feed
- Decart Lucy VTON transforms the feed in real-time, dressing them in the selected product
- The entire experience runs in the browser with sub-second latency

---

## 2. Functional requirements

### 2.1 Product catalogue panel

| Requirement | Detail |
|---|---|
| **Category navigation** | Tabs or segment control: T-Shirts, Sweatshirts & Hoodies, Jackets, Polos, Accessories |
| **Product cards** | Thumbnail (garment photo on white bg), product name, style code (e.g. STTU169), fit description, fabric weight (GSM) |
| **Product selection** | Click selects; active card shows checkmark; only one product active at a time |
| **Colorway picker** | Row of circular swatches below the product grid; each shows hex fill + tooltip with color name; clicking a swatch selects the colorway and updates the prompt |
| **Search / filter** | Text search by name or style code; optional filter by fit (Regular, Relaxed, Slim, Boxy) |
| **Garment images** | Product images should be clean garment-only shots on white/light backgrounds (ideal for Lucy VTON reference images). These come from the ST/ST product feed / PIM. |

### 2.2 Garment image upload

| Requirement | Detail |
|---|---|
| **Drag & drop zone** | Users can upload their own garment image (PNG, JPG, WebP) |
| **Preview thumbnail** | Show a small preview of the uploaded image |
| **Precedence** | If a custom upload is provided, it takes precedence over the catalogue selection as the reference image |
| **Max file size** | 5 MB; client-side validation |
| **Min resolution** | 512 × 512 px recommended; show warning if smaller |

### 2.3 Try-on prompt

| Requirement | Detail |
|---|---|
| **Auto-generated prompt** | When user selects product + color, a prompt is auto-generated using the `Substitute the current top with…` pattern, including color, material, fit, and visible design details |
| **Editable text area** | The generated prompt is displayed in an editable textarea so advanced users can refine it |
| **Auto-enhance button** | "Auto" button appends sustainability/material details from the product metadata |
| **LLM prompt generation** | (Phase 2) Send garment image + optional camera frame to a vision LLM to auto-generate the ideal prompt per Decart docs |
| **Prompt debounce** | During a live session, prompt changes are debounced at 400 ms before being sent |
| **`enhance` flag** | Default `false` when the app generates a detailed prompt; `true` when user writes a short free-form prompt |

### 2.4 Live video pane

| Requirement | Detail |
|---|---|
| **Dual video layout** | Side-by-side: left = user's camera (labeled "You"), right = Lucy VTON output (labeled "Try-On") |
| **Single-column mobile** | On viewports < 768 px, stack vertically: camera on top, output below |
| **Aspect ratio** | 16:9 (matching Lucy VTON model specs: 1280 × 720) |
| **Placeholders** | Before connection: show placeholder with icon + instruction text |
| **Live badge** | Green "● LIVE" badge on the output pane when connected |
| **Camera facing** | Default front camera (`facingMode: "user"`); optional toggle for rear camera on mobile |
| **Mirror local** | Local camera feed is CSS-mirrored (`transform: scaleX(-1)`) for natural preview; remote is not mirrored |
| **Full-screen** | Optional full-screen button on the output pane |

### 2.5 Session controls

| Requirement | Detail |
|---|---|
| **Start button** | Validates API key → requests camera → connects to Lucy VTON |
| **Stop button** | Disconnects WebRTC, stops camera tracks, resets UI |
| **Status indicator** | Pill badge with dot animation showing: `idle`, `connecting`, `live`, `reconnecting`, `error` |
| **Session timer** | Show elapsed seconds (driven by `generationTick` event) |
| **Cost indicator** | Show running cost estimate: seconds × 2 credits/sec |

### 2.6 Product info bar

| Requirement | Detail |
|---|---|
| **Selected item** | Product name + style code |
| **Color** | Selected colorway name |
| **Certifications** | Display GOTS, GRS, PETA, Fair Wear badges as applicable |
| **Fabric** | Material composition (e.g. "100% organic ring-spun cotton") |

### 2.7 Authentication & security

| Requirement | Detail |
|---|---|
| **Client tokens** | In production, the frontend NEVER receives the permanent `sk-…` key. A backend endpoint creates short-lived `ek_…` client tokens (10-min TTL) via `client.tokens.create()` |
| **Token endpoint** | `POST /api/vto/token` — authenticated (session cookie / JWT), rate-limited (10 req/min per user) |
| **Dev mode** | For local development, allow pasting `sk-…` directly in a UI field (disabled in production builds via env flag) |

---

## 3. Non-functional requirements

| Area | Requirement |
|---|---|
| **Latency** | Camera-to-output < 200 ms (dependent on Decart infra; app must not add > 50 ms) |
| **Browser support** | Chrome 90+, Edge 90+, Safari 16+, Firefox 100+ (WebRTC + getUserMedia) |
| **Mobile** | Responsive layout; front/rear camera toggle; VP8 codec handling |
| **Accessibility** | WCAG 2.1 AA — keyboard navigation, aria labels on controls, reduced-motion support |
| **Performance** | Sidebar renders instantly; video elements lazy-load; no layout shift during connection |
| **Analytics** | Track: session start/stop, product selections, session duration, errors, browser/device |
| **Error UX** | Friendly messages for: camera denied, no camera found, API key invalid, connection lost, model error |
| **Theming** | Match Stanley/Stella brand: cream background (#F7F4EF), charcoal text (#1C1C1A), green accent (#2D5A3D), DM Sans + Playfair Display fonts |

---

## 4. Data model

### 4.1 Product

```typescript
interface Product {
  id: string;                    // e.g. "creator-2-sttu169"
  styleCode: string;             // e.g. "STTU169"
  name: string;                  // e.g. "Creator 2.0"
  category: ProductCategory;     // "tshirts" | "hoodies" | "jackets" | "polos" | "accessories"
  fit: string;                   // "Regular" | "Relaxed" | "Slim" | "Boxy"
  fabricWeight: string;          // "155 GSM"
  material: string;              // "100% organic ring-spun cotton"
  certifications: string[];      // ["GOTS", "GRS", "PETA", "FairWear"]
  garmentImageUrl: string;       // clean product shot (white bg)
  thumbnailUrl: string;          // smaller version for grid
  colors: ColorVariant[];
  promptTemplate: string;        // e.g. "Substitute the current top with a {color} {description}"
  description: string;           // garment description for prompt generation
}

interface ColorVariant {
  name: string;    // "French Navy"
  hex: string;     // "#223A5E"
  pantone?: string; // "19-3933 TCX"
}

type ProductCategory = "tshirts" | "hoodies" | "jackets" | "polos" | "accessories";
```

### 4.2 Try-on session state

```typescript
interface TryOnSession {
  status: "idle" | "connecting" | "live" | "reconnecting" | "error";
  selectedProduct: Product | null;
  selectedColor: ColorVariant | null;
  prompt: string;
  garmentImage: File | string | null;  // user upload or product URL
  elapsedSeconds: number;
  error: string | null;
}
```

---

## 5. Decart API integration

### 5.1 Model

Use the dedicated VTON model:

```
Model string: "lucy-vton-latest"
Endpoint:     wss://api3.decart.ai/v1/stream?model=lucy-2.1-vton
Resolution:   1280 × 720 (720p)
Frame rate:   25 FPS
Pricing:      2 credits / second
```

### 5.2 SDK integration (recommended path)

```typescript
import { createDecartClient, models } from "@decartai/sdk";

const model = models.realtime("lucy-vton-latest");

const stream = await navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    facingMode: "user",
    frameRate: model.fps,
    width: model.width,
    height: model.height,
  },
});

const client = createDecartClient({ apiKey: clientToken });

const realtimeClient = await client.realtime.connect(stream, {
  model,
  onRemoteStream: (editedStream) => {
    outputVideoElement.srcObject = editedStream;
  },
});

// Apply garment with image + prompt
await realtimeClient.set({
  prompt: "Substitute the current top with a french navy crew neck t-shirt with a regular fit and short sleeves, made from organic ring-spun cotton",
  image: garmentImageFile,   // File or URL
  enhance: false,
});
```

### 5.3 Prompt patterns

Follow the Decart VTON prompting guide:

```
✅ "Substitute the current top with a bright red hoodie with an oversized casual fit"
✅ "Add a navy baseball cap with a blue logo to the person's head"
✅ "Substitute the current bottoms with dark blue slim-fit jeans"

❌ "Put a jacket on the person"         (too vague)
❌ "Red hoodie"                          (missing action)
```

Target 20–30 words per prompt. Include: action (substitute/add), color, material, texture, fit, visible design details.

### 5.4 Reference images best practices

- Clean garment images on white/plain backgrounds
- At least 512 × 512 px
- Just the clothing item, no person wearing it
- Supported formats: JPEG, PNG, WebP

### 5.5 Connection lifecycle

```
1. Frontend calls POST /api/vto/token
2. Backend creates client token via SDK: client.tokens.create()
3. Frontend receives { apiKey: "ek_...", expiresAt: "..." }
4. Frontend calls getUserMedia() for camera
5. Frontend calls client.realtime.connect(stream, { model, onRemoteStream })
6. User selects product → frontend calls realtimeClient.set({ prompt, image })
7. User changes product → frontend calls realtimeClient.set({ prompt, image }) again (no reconnect needed)
8. User ends session → realtimeClient.disconnect() + stream.getTracks().forEach(t => t.stop())
```

### 5.6 Error codes to handle

| Code | Meaning | UX action |
|---|---|---|
| `INVALID_API_KEY` | Bad or expired token | Redirect to re-auth / request new token |
| `WEB_RTC_ERROR` | Network/WebRTC failure | Show network error, attempt reconnect |
| `MODEL_NOT_FOUND` | Model unavailable | Show maintenance message |
| `NotAllowedError` (browser) | Camera permission denied | Show permission instructions |
| `NotFoundError` (browser) | No camera available | Show "no camera" message |

### 5.7 Auto-reconnect

The SDK handles reconnection automatically (5 retries with exponential backoff). The app must:
- Listen to `connectionChange` events
- Update UI status during `reconnecting` state
- Show disconnect UI if all retries fail

---

## 6. Phased delivery

### Phase 1 — MVP (4 weeks)

- Next.js 14+ app with App Router
- Sidebar with hardcoded product catalogue (20–30 products)
- Color picker per product
- Auto-generated prompts from product metadata
- Dual video pane with Lucy VTON integration via `@decartai/sdk`
- Client token endpoint (`/api/vto/token`)
- Connection status UI
- Responsive layout (desktop + mobile)
- Error handling for all known failure modes
- Dev mode (paste API key)

### Phase 2 — Production polish (3 weeks)

- Connect to ST/ST product feed / PIM API for dynamic catalogue
- LLM-powered prompt generation from garment images (Claude or GPT-4o-mini vision)
- Session analytics (Mixpanel / PostHog)
- Full-screen output mode
- Share / screenshot feature
- Session cost tracker with generationTick
- Rate limiting on token endpoint
- CSP headers for production security

### Phase 3 — Showroom / kiosk mode (2 weeks)

- Kiosk layout (single large output + small camera inset)
- Auto-rotate featured products
- Idle screen with attract loop
- Hardware integration guide (camera, display, networking)
- Optional QR code to continue shopping from phone

---

## 7. Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Where do garment images come from — PIM API, CDN, or bundled? | Product team | Open |
| 2 | What is the ST/ST product feed format (JSON, API, CSV)? | Engineering | Open |
| 3 | Do we need user authentication or is VTO open to all visitors? | Product team | Open |
| 4 | Budget for Decart API credits — cap per session? per day? | Finance | Open |
| 5 | Should we support accessories (hats, bags) in Phase 1? | Product team | Open |
| 6 | Is there an existing component library / design system to integrate with? | Frontend team | Open |
| 7 | Hosting: Vercel, AWS, or existing infra? | DevOps | Open |
