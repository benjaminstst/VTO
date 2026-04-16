# Deployment Guide — ST/ST Virtual Try-On

## 1. Environment setup

### Prerequisites

- Node.js 20+ (LTS)
- npm 10+ or pnpm 8+
- A Decart API key from https://platform.decart.ai
- Git

### Local development

```bash
# Clone the repository
git clone git@github.com:your-org/stst-virtual-tryon.git
cd stst-virtual-tryon

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Decart API key
# DECART_API_KEY=sk-your-key-here
# NEXT_PUBLIC_DEV_MODE=true

# Start dev server
npm run dev
# → http://localhost:3000/tryon
```

**Important:** HTTPS is required for `getUserMedia()` in most browsers. For local development, use:

```bash
# Option 1: mkcert (recommended)
brew install mkcert    # macOS
mkcert -install
mkcert localhost
# Then configure Next.js to use the cert

# Option 2: Chrome flag
# Navigate to chrome://flags/#unsafely-treat-insecure-origin-as-secure
# Add http://localhost:3000

# Option 3: Use ngrok for HTTPS tunnel
ngrok http 3000
```

---

## 2. Environment variables

### Required

| Variable | Where | Description |
|---|---|---|
| `DECART_API_KEY` | Server only | Your permanent Decart API key (`sk-…`). Used to create client tokens. |

### Optional

| Variable | Where | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | Client + server | `development` | `development`, `staging`, `production` |
| `NEXT_PUBLIC_DEV_MODE` | Client | `false` | Show API key input in sidebar (for dev/demo) |
| `NEXT_PUBLIC_MAX_SESSION_SECONDS` | Client | `300` | Max VTO session duration in seconds |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | — | PostHog project key (Phase 2) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | — | PostHog ingest URL (Phase 2) |

### .env.example

```env
# Decart API (required)
DECART_API_KEY=sk-your-decart-api-key-here

# App config
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_MAX_SESSION_SECONDS=300

# Analytics (Phase 2)
# NEXT_PUBLIC_POSTHOG_KEY=phc_...
# NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 3. Build & deploy

### Build

```bash
npm run build
# → .next/ output directory
```

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Vercel environment variables:** Add `DECART_API_KEY` in the Vercel dashboard under Settings → Environment Variables. Mark it as "Production" and "Preview" only — never expose in client builds.

### Docker (self-hosted)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ../../Downloads .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t stst-vto .
docker run -p 3000:3000 \
  -e DECART_API_KEY=sk-your-key \
  -e NEXT_PUBLIC_APP_ENV=production \
  -e NEXT_PUBLIC_DEV_MODE=false \
  stst-vto
```

---

## 4. Security headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api3.decart.ai wss://api3.decart.ai https://api.decart.ai",
      "frame-src 'none'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=()",
  },
];
```

Critical CSP entries for Decart WebRTC:
- `connect-src`: `https://api3.decart.ai`, `wss://api3.decart.ai`, `https://api.decart.ai`
- `media-src`: `blob:` (required for WebRTC media streams)
- `Permissions-Policy`: `camera=(self)` — allows camera access on your domain

---

## 5. STUN/TURN configuration

The Decart SDK uses Google's public STUN server by default:

```
stun:stun.l.google.com:19302
```

For corporate networks or firewalls that block STUN:
- Ensure UDP port 19302 is open outbound
- Ensure WebRTC media ports (UDP 10000–60000) are not blocked
- Consider deploying a TURN server (e.g. Twilio, coturn) as fallback

---

## 6. Monitoring

### Health checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

### Decart API status

Monitor https://status.decart.ai for API availability. Set up a status page webhook for alerts.

### Key metrics to track

| Metric | Source | Alert threshold |
|---|---|---|
| Token creation failures | Server logs | > 5% failure rate |
| WebRTC connection failures | Client analytics | > 10% failure rate |
| Session duration | `generationTick` events | Avg > 5 min (cost concern) |
| Camera permission denials | Client analytics | > 30% of attempts |
| Decart API latency | Client-side timing | P95 > 300 ms |

---

## 7. Showroom / kiosk deployment

For trade show or physical showroom deployment:

### Hardware requirements

| Component | Specification |
|---|---|
| Display | 43"–55" 4K screen, portrait or landscape orientation |
| Computer | Mini PC (Intel NUC or Mac Mini), Chrome browser in kiosk mode |
| Camera | Logitech C920 or C922 (1080p, good low-light) mounted above screen |
| Network | Dedicated WiFi or Ethernet; min 10 Mbps up/down; UDP ports open |
| Mounting | VESA mount for screen; camera mount above center of display |

### Kiosk mode setup

```bash
# Chrome kiosk mode (Linux/macOS)
google-chrome \
  --kiosk \
  --disable-translate \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --start-fullscreen \
  --autoplay-policy=no-user-gesture-required \
  "https://your-domain.com/tryon?mode=kiosk"
```

### Kiosk URL parameters

| Parameter | Value | Effect |
|---|---|---|
| `mode=kiosk` | `kiosk` | Hides sidebar, shows large output + small camera inset |
| `category=tshirts` | Product category | Pre-selects product category |
| `autoStart=true` | `true` | Auto-starts camera on page load |
| `sessionCap=120` | Seconds | Auto-stops after N seconds |

### Network considerations for events

- Bring your own mobile hotspot as backup
- Pre-test venue WiFi for WebRTC compatibility
- Ensure no captive portal interferes with WebSocket connections
- Consider pre-loading the page and keeping a session warm during idle time
