# Development Plan — ST/ST Virtual Try-On

## 1. Technology stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO pages, API routes for token endpoint, React Server Components for catalogue |
| **Language** | TypeScript (strict) | Type safety for SDK integration, data models, API contracts |
| **Styling** | Tailwind CSS 3.4+ | Utility-first, easy theming via CSS variables, matches ST/ST's clean aesthetic |
| **State management** | Zustand | Lightweight, no boilerplate; manages session state + product selection |
| **Decart SDK** | `@decartai/sdk` (npm) | Official JS SDK for WebRTC signaling, connection management, prompt API |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |
| **Fonts** | DM Sans + Playfair Display (Google Fonts) | Matches brand; DM Sans for UI, Playfair for display headings |
| **Testing** | Vitest + React Testing Library + Playwright | Unit/component tests + E2E for connection flow |
| **Linting** | ESLint + Prettier | Consistency, auto-formatting |
| **Deployment** | Vercel (recommended) or Docker | Zero-config Next.js deployment; Docker for self-hosted option |

---

## 2. Project structure

```
stst-virtual-tryon/
├── .env.local                        # Local env vars (DECART_API_KEY, etc.)
├── .env.example                      # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── docs/
│   ├── SPEC.md                       # Product specification
│   ├── DEVELOPMENT_PLAN.md           # This file
│   ├── ARCHITECTURE.md               # Architecture & data flow
│   ├── DECART_INTEGRATION.md         # Decart API reference & patterns
│   ├── PRODUCT_CATALOGUE_SCHEMA.md   # Product data format
│   └── DEPLOYMENT.md                 # Deployment & environment guide
│
├── public/
│   ├── fonts/
│   ├── images/
│   │   └── products/                 # Static garment images (Phase 1)
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with fonts, metadata
│   │   ├── page.tsx                  # Landing / redirect
│   │   ├── globals.css               # Tailwind directives + CSS vars
│   │   │
│   │   ├── tryon/
│   │   │   ├── page.tsx              # Main VTO page
│   │   │   └── layout.tsx            # VTO layout (sidebar + main)
│   │   │
│   │   └── api/
│   │       └── vto/
│   │           └── token/
│   │               └── route.ts      # POST — create Decart client token
│   │
│   ├── components/
│   │   ├── ui/                       # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── SegmentControl.tsx
│   │   │   ├── StatusPill.tsx
│   │   │   ├── ColorSwatch.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   └── UploadZone.tsx
│   │   │
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx           # Sidebar container
│   │   │   ├── ApiKeyInput.tsx       # Dev mode API key input
│   │   │   ├── ProductGrid.tsx       # Product card grid
│   │   │   ├── ProductCard.tsx       # Single product card
│   │   │   ├── ColorPicker.tsx       # Colorway swatches
│   │   │   ├── GarmentUpload.tsx     # Custom garment upload
│   │   │   ├── PromptEditor.tsx      # Prompt textarea + auto button
│   │   │   └── SessionControls.tsx   # Start/stop + status + timer
│   │   │
│   │   ├── video/
│   │   │   ├── VideoStage.tsx        # Dual video pane container
│   │   │   ├── VideoBox.tsx          # Single video element + placeholder
│   │   │   ├── LiveBadge.tsx         # Green LIVE indicator
│   │   │   └── FullScreenButton.tsx  # Phase 2
│   │   │
│   │   └── info/
│   │       ├── ProductInfoBar.tsx    # Bottom info bar
│   │       └── CertBadge.tsx         # GOTS / GRS / PETA badge
│   │
│   ├── hooks/
│   │   ├── useDecartSession.ts       # Core hook: connect/disconnect/setPrompt
│   │   ├── useCamera.ts             # getUserMedia management
│   │   ├── useClientToken.ts        # Fetch token from backend
│   │   └── usePromptBuilder.ts      # Auto-generate prompt from product + color
│   │
│   ├── stores/
│   │   └── tryonStore.ts            # Zustand store for session state
│   │
│   ├── lib/
│   │   ├── decart.ts                # Decart SDK wrapper + helpers
│   │   ├── products.ts              # Product catalogue data (Phase 1: static JSON)
│   │   ├── colors.ts                # Color name mappings
│   │   ├── prompts.ts               # Prompt template builders
│   │   └── analytics.ts             # Event tracking abstraction
│   │
│   ├── types/
│   │   ├── product.ts               # Product, ColorVariant, ProductCategory
│   │   └── session.ts               # TryOnSession, ConnectionStatus
│   │
│   └── data/
│       └── catalogue.json           # Static product data (Phase 1)
│
├── tests/
│   ├── unit/
│   │   ├── prompts.test.ts
│   │   ├── products.test.ts
│   │   └── tryonStore.test.ts
│   ├── component/
│   │   ├── ProductCard.test.tsx
│   │   ├── ColorPicker.test.tsx
│   │   └── PromptEditor.test.tsx
│   └── e2e/
│       └── tryon-flow.spec.ts       # Playwright E2E
│
└── scripts/
    └── generate-catalogue.ts        # (Phase 2) Pull from PIM API → catalogue.json
```

---

## 3. Key implementation details

### 3.1 `useDecartSession` hook (core)

This is the most critical piece. It manages the entire WebRTC lifecycle.

```typescript
// src/hooks/useDecartSession.ts — interface sketch

interface UseDecartSessionOptions {
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: DecartSDKError) => void;
  onTick?: (seconds: number) => void;
}

interface UseDecartSessionReturn {
  status: ConnectionStatus;
  elapsedSeconds: number;
  error: string | null;
  start: (stream: MediaStream, apiKey: string) => Promise<void>;
  stop: () => void;
  updateOutfit: (prompt: string, image?: File | string) => Promise<void>;
  outputStream: MediaStream | null;
}
```

Key responsibilities:
- Call `createDecartClient({ apiKey })` with client token
- Call `client.realtime.connect(stream, { model, onRemoteStream })`
- Register `connectionChange` and `error` and `generationTick` event listeners
- Expose `updateOutfit()` which calls `realtimeClient.set({ prompt, image, enhance })`
- Handle cleanup on unmount (disconnect + stop tracks)
- Debounce prompt updates internally (400 ms)

### 3.2 Token endpoint

```typescript
// src/app/api/vto/token/route.ts

import { createDecartClient } from "@decartai/sdk";
import { NextResponse } from "next/server";

const client = createDecartClient({
  apiKey: process.env.DECART_API_KEY!,
});

export async function POST() {
  try {
    const token = await client.tokens.create();
    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
```

In production, add:
- Authentication middleware (session cookie or JWT)
- Rate limiting (10 req/min per user)
- Logging (token creation events)

### 3.3 Prompt builder

```typescript
// src/lib/prompts.ts

export function buildPrompt(product: Product, color: ColorVariant): string {
  const colorName = color.name.toLowerCase();
  const parts = [
    `Substitute the current top with a ${colorName}`,
    product.description,  // e.g. "crew neck t-shirt with a regular fit and short sleeves"
  ];

  // Add material if it's a visible texture
  if (product.material.includes("denim") || product.material.includes("fleece")) {
    parts.push(`made from ${product.material.toLowerCase()}`);
  }

  return parts.join(" ");
}
```

### 3.4 Camera management

```typescript
// src/hooks/useCamera.ts

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const startCamera = async () => {
    const s = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: facing,
        frameRate: { ideal: 25 },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    setStream(s);
    return s;
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  // When facing changes during live session, restart camera + reconnect
  const toggleCamera = async () => {
    setFacing(f => f === "user" ? "environment" : "user");
    // Caller must handle reconnection
  };

  return { stream, startCamera, stopCamera, toggleCamera, facing };
}
```

---

## 4. Sprint plan

### Sprint 1 — Foundation (Week 1)

| Task | Estimate | Owner |
|---|---|---|
| Project scaffolding (Next.js + Tailwind + TypeScript + ESLint) | 2h | Dev |
| Define TypeScript types (`product.ts`, `session.ts`) | 1h | Dev |
| Build static product catalogue JSON (15–20 products) | 3h | Dev + Product |
| Implement Zustand store (`tryonStore.ts`) | 2h | Dev |
| Build UI primitives (`Button`, `SegmentControl`, `StatusPill`, `ColorSwatch`) | 4h | Dev |
| Build `Sidebar` shell + `ProductGrid` + `ProductCard` | 4h | Dev |
| Build `ColorPicker` component | 2h | Dev |
| Implement page layout (sidebar + main area) | 2h | Dev |
| **Sprint 1 total** | **~20h** | |

### Sprint 2 — Core VTO integration (Week 2)

| Task | Estimate | Owner |
|---|---|---|
| Implement `useCamera` hook | 3h | Dev |
| Implement token endpoint (`/api/vto/token`) | 2h | Dev |
| Implement `useClientToken` hook | 1h | Dev |
| Implement `useDecartSession` hook (full lifecycle) | 8h | Dev |
| Build `VideoStage` + `VideoBox` components | 4h | Dev |
| Build `SessionControls` (Start/Stop + status) | 3h | Dev |
| Build `PromptEditor` + `usePromptBuilder` | 3h | Dev |
| End-to-end smoke test (camera → Lucy VTON → output) | 4h | Dev |
| **Sprint 2 total** | **~28h** | |

### Sprint 3 — Polish & error handling (Week 3)

| Task | Estimate | Owner |
|---|---|---|
| Build `GarmentUpload` (drag/drop + preview) | 3h | Dev |
| Build `ProductInfoBar` + `CertBadge` | 2h | Dev |
| Build `LiveBadge` component | 1h | Dev |
| Implement comprehensive error handling (all error codes) | 4h | Dev |
| Mobile responsive layout + camera facing toggle | 4h | Dev |
| Session timer display (`generationTick`) | 2h | Dev |
| Accessibility pass (keyboard nav, aria, focus management) | 4h | Dev |
| Loading states and skeleton UI | 2h | Dev |
| **Sprint 3 total** | **~22h** | |

### Sprint 4 — Testing & deployment (Week 4)

| Task | Estimate | Owner |
|---|---|---|
| Unit tests (prompt builder, store, product utils) | 4h | Dev |
| Component tests (ProductCard, ColorPicker, PromptEditor) | 4h | Dev |
| E2E test with Playwright (mocked WebRTC) | 6h | Dev |
| Performance audit (Lighthouse, bundle size) | 2h | Dev |
| Environment setup (staging + production) | 3h | DevOps |
| Documentation cleanup | 2h | Dev |
| UAT with stakeholders | 4h | Team |
| Bug fixes from UAT | 4h | Dev |
| **Sprint 4 total** | **~29h** | |

---

## 5. Environment variables

```env
# .env.local (never committed)

# Decart API
DECART_API_KEY=sk-...                    # Server-side only, for token creation

# App config
NEXT_PUBLIC_APP_ENV=development          # development | staging | production
NEXT_PUBLIC_DEV_MODE=true                # Show API key input in sidebar (dev only)
NEXT_PUBLIC_MAX_SESSION_SECONDS=300      # 5 min cap per session (Phase 2)

# Analytics (Phase 2)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://...
```

---

## 6. CI/CD pipeline

```yaml
# .github/workflows/ci.yml (simplified)

name: CI
on: [push, pull_request]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  e2e:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [lint-test, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 7. Risk register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Decart API latency spikes | High | Medium | Show "processing" overlay, auto-reconnect, fallback to static preview |
| Camera permission denied by user | Medium | High | Clear instructions with animated guide, fallback to "upload photo" mode |
| High Decart API cost at scale | High | Medium | Session time caps, credit budget alerts, queue management |
| Browser WebRTC incompatibilities | Medium | Low | Feature detection, graceful degradation message, tested browser matrix |
| Garment images produce poor results | Medium | Medium | Provide image quality guidelines, offer LLM prompt enhancement, curate catalogue images |
| Lucy VTON model changes breaking API | High | Low | Pin model version (`lucy-2.1-vton`), monitor Decart changelog |
