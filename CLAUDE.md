# CLAUDE.md — Agent Instructions for ST/ST Virtual Try-On

> This file tells Claude Code how to work on this project.

## Project overview

This is a Next.js 14+ (App Router) web application for Stanley/Stella's Virtual Try-On experience. It uses the Decart Lucy VTON engine to dress website visitors in ST/ST garments in real-time via WebRTC.

## Key documentation

Read these files before making changes:

- `docs/SPEC.md` — Product specification (requirements, data model, Decart API details)
- `docs/DEVELOPMENT_PLAN.md` — Architecture, project structure, sprint plan
- `docs/ARCHITECTURE.md` — System diagram, component tree, state management
- `docs/DECART_INTEGRATION.md` — Decart SDK patterns, prompt engineering, error handling
- `docs/PRODUCT_CATALOGUE_SCHEMA.md` — Product data types, sample data, image requirements
- `docs/DEPLOYMENT.md` — Environment variables, deployment, security headers

## Tech stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.4+
- **State:** Zustand
- **Video AI:** `@decartai/sdk` (npm package)
- **Icons:** Lucide React
- **Fonts:** DM Sans (body) + Playfair Display (display headings)
- **Testing:** Vitest + React Testing Library + Playwright

## Code style

- Use functional components with hooks
- Prefer named exports
- Use `interface` over `type` for object shapes
- Use early returns for guard clauses
- Keep components under 150 lines; extract hooks and utils
- Use Tailwind utility classes; avoid inline styles
- CSS variables for brand colors (defined in `globals.css`)
- No `any` — type everything

## Brand colors (Stanley/Stella)

```
Cream background: #F7F4EF
Charcoal text:    #1C1C1A
Warm gray:        #6B6860
Green accent:     #2D5A3D
Green light:      #EAF2EC
Error red:        #C0392B
```

## Important patterns

### Decart SDK usage

Always use `lucy-vton-latest` model (NOT generic `lucy-2`):
```typescript
import { models } from "@decartai/sdk";
const model = models.realtime("lucy-vton-latest");
```

Always use `set()` for atomic outfit changes (not separate `setPrompt` + `setImage`):
```typescript
await realtimeClient.set({ prompt, image, enhance: false });
```

Never reconnect just to change outfits — call `set()` on the existing connection.

### Prompts

Follow the "Substitute the current {area} with a {color} {description}" pattern.
Target 20–30 words. Include: color, garment type, fit, visible design details.
Set `enhance: false` when the app generates the prompt, `true` for user-typed short prompts.

### Client tokens

NEVER expose the permanent `sk-…` key to the browser. Always use the `/api/vto/token` endpoint to create short-lived `ek_…` tokens. Exception: dev mode (`NEXT_PUBLIC_DEV_MODE=true`).

### Camera

Always request camera matching model specs:
```typescript
{ frameRate: model.fps, width: model.width, height: model.height }
```
Use `{ ideal: ... }` constraints for wider device compatibility.

### Cleanup

Always disconnect + stop tracks on unmount:
```typescript
realtimeClient.disconnect();
stream.getTracks().forEach(t => t.stop());
```

## File structure conventions

- Components: `src/components/{area}/{ComponentName}.tsx`
- Hooks: `src/hooks/use{HookName}.ts`
- Types: `src/types/{domain}.ts`
- Utils/lib: `src/lib/{module}.ts`
- API routes: `src/app/api/{domain}/{action}/route.ts`
- Tests mirror source: `tests/unit/`, `tests/component/`, `tests/e2e/`

## Testing

```bash
npm run test          # Vitest unit + component tests
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

## Common tasks

| Task | Command / approach |
|---|---|
| Add a new product | Add entry to `src/data/catalogue.json` following schema in `PRODUCT_CATALOGUE_SCHEMA.md` |
| Add a new color | Add `ColorVariant` entry to the product's `colors` array |
| Change VTON model | Update model string in `src/lib/decart.ts` |
| Modify prompt template | Edit `buildVtonPrompt()` in `src/lib/prompts.ts` |
| Add a new product category | Add to `ProductCategory` type + update `SegmentControl` tabs |
| Add error handling | Follow patterns in `DECART_INTEGRATION.md` section 7 |
