# Product Catalogue Schema

This document defines the data format for Stanley/Stella products used in the Virtual Try-On application.

---

## 1. TypeScript interfaces

```typescript
// src/types/product.ts

export type ProductCategory =
  | "tshirts"
  | "hoodies"
  | "jackets"
  | "polos"
  | "accessories";

export interface ColorVariant {
  /** Display name — e.g. "French Navy" */
  name: string;
  /** Hex color code — e.g. "#223A5E" */
  hex: string;
  /** Optional Pantone reference — e.g. "19-3933 TCX" */
  pantone?: string;
  /** URL to garment image in this specific color (white bg, no model) */
  garmentImageUrl?: string;
}

export interface Product {
  /** Unique identifier — e.g. "creator-2-sttu169" */
  id: string;
  /** Stanley/Stella style code — e.g. "STTU169" */
  styleCode: string;
  /** Product name — e.g. "Creator 2.0" */
  name: string;
  /** Product category */
  category: ProductCategory;
  /** Fit type — e.g. "Regular", "Relaxed", "Slim", "Boxy" */
  fit: string;
  /** Fabric weight — e.g. "155 GSM" */
  fabricWeight: string;
  /** Material composition — e.g. "100% organic ring-spun combed cotton" */
  material: string;
  /** Applicable certifications */
  certifications: Certification[];
  /** Default garment image URL (white bg, no model, front view) */
  garmentImageUrl: string;
  /** Thumbnail for sidebar grid (smaller, optimized) */
  thumbnailUrl: string;
  /** Available colorways */
  colors: ColorVariant[];
  /**
   * Garment description for VTON prompt generation.
   * Should describe ONLY visible features: collar type, sleeve length, fit, pockets, etc.
   * Do NOT include color (injected at runtime), certifications, or material unless visually obvious.
   * Example: "crew neck t-shirt with a regular fit and short sleeves"
   */
  description: string;
  /** Target body area for prompt pattern */
  bodyArea: "top" | "bottoms" | "headwear" | "full-body";
  /** Gender targeting */
  gender: "unisex" | "men" | "women" | "kids";
  /** Size range — e.g. "XS–3XL" */
  sizeRange: string;
}

export type Certification = "GOTS" | "GRS" | "PETA" | "FairWear" | "OCS";
```

---

## 2. Sample catalogue entry

```json
{
  "id": "creator-2-sttu169",
  "styleCode": "STTU169",
  "name": "Creator 2.0",
  "category": "tshirts",
  "fit": "Regular",
  "fabricWeight": "180 GSM",
  "material": "100% organic ring-spun combed cotton",
  "certifications": ["GOTS", "PETA", "FairWear"],
  "garmentImageUrl": "/images/products/sttu169-front.png",
  "thumbnailUrl": "/images/products/sttu169-thumb.png",
  "colors": [
    { "name": "White", "hex": "#FFFFFF" },
    { "name": "Natural Raw", "hex": "#F2E8D5" },
    { "name": "French Navy", "hex": "#223A5E" },
    { "name": "Black", "hex": "#1C1C1A" },
    { "name": "Bright Red", "hex": "#CC2D2D" },
    { "name": "Khaki", "hex": "#8B7D5E" },
    { "name": "Desert Dust", "hex": "#C5B494" },
    { "name": "Stargazer", "hex": "#3A5A78" },
    { "name": "Heather Grey", "hex": "#B5B3AD" }
  ],
  "description": "crew neck t-shirt with a regular fit and short sleeves",
  "bodyArea": "top",
  "gender": "unisex",
  "sizeRange": "XXS–5XL"
}
```

---

## 3. Phase 1 catalogue (hardcoded)

For Phase 1, create a static JSON file at `src/data/catalogue.json` with 20–30 products covering the core categories. Suggested selection:

### T-Shirts (8–10 products)
| Style Code | Name | Fit | Notes |
|---|---|---|---|
| STTU169 | Creator 2.0 | Regular | Core unisex tee |
| STTU758 | Rocker | Regular | Classic fit |
| STTW172 | Stella Expresser 2.0 | Fitted | Women's fitted |
| STTU755 | Stanley Sparker 2.0 | Slim | Men's slim |
| STTU815 | Freestyler | Relaxed | Oversized / boxy |
| STTU976 | Crafter Vintage | Regular | Garment-dyed |
| STTU959 | Blaster 2.0 | Oversized | High neck |
| SATW030 | Stella Nova | Relaxed | Women's relaxed |

### Hoodies & Sweatshirts (6–8 products)
| Style Code | Name | Fit | Notes |
|---|---|---|---|
| STSU823 | Changer 2.0 | Regular | Pullover hoodie |
| STSU177 | Connector 2.0 | Regular | Zip hoodie |
| STSU823 | Drummer 2.0 | Regular | Crewneck sweat |
| STSU182 | Cruiser 2.0 | Relaxed | Organic hoodie |
| STSW130 | Stella Trigger | Regular | Women's hoodie |

### Jackets (3–4 products)
| Style Code | Name | Fit | Notes |
|---|---|---|---|
| STJU841 | Stanley Navigator | Regular | Bomber jacket |
| STJU175 | Stanley Worker | Boxy | Denim jacket |
| STJW166 | Stella Achiever | Regular | Women's jacket |

### Polos (2–3 products)
| Style Code | Name | Fit | Notes |
|---|---|---|---|
| STPM563 | Stanley Dedicator 2.0 | Regular | Men's polo |
| STPW036 | Stella Elliser | Fitted | Women's polo |

---

## 4. Prompt generation from catalogue

```typescript
// src/lib/prompts.ts

import type { Product, ColorVariant } from "@/types/product";

/**
 * Build a VTON prompt from product + color selection.
 * Follows Decart's "Substitute the current {area} with..." pattern.
 */
export function buildVtonPrompt(product: Product, color: ColorVariant): string {
  const colorName = color.name.toLowerCase();
  const area = product.bodyArea === "top" ? "top"
    : product.bodyArea === "bottoms" ? "bottoms"
    : product.bodyArea === "headwear" ? "headwear"
    : "outfit";

  return `Substitute the current ${area} with a ${colorName} ${product.description}`;
}

/**
 * Enhanced prompt that includes material when visually relevant.
 */
export function buildEnhancedPrompt(product: Product, color: ColorVariant): string {
  const base = buildVtonPrompt(product, color);

  // Only add material if it changes the visual texture
  const visualMaterials = ["denim", "fleece", "corduroy", "velvet", "satin", "mesh", "knit"];
  const hasVisualMaterial = visualMaterials.some(m =>
    product.material.toLowerCase().includes(m)
  );

  if (hasVisualMaterial) {
    return `${base}, made from ${product.material.toLowerCase()}`;
  }

  return base;
}

// Examples of generated prompts:
// "Substitute the current top with a french navy crew neck t-shirt with a regular fit and short sleeves"
// "Substitute the current top with a black pullover hoodie with a kangaroo pocket and drawstring hood, relaxed fit"
// "Substitute the current top with a desert dust denim jacket with a boxy fit, chest pockets, and button front, made from organic denim"
```

---

## 5. Image requirements

### For catalogue garment images (used as VTON reference):

| Property | Requirement |
|---|---|
| Format | PNG preferred (transparent bg), JPEG acceptable (white bg) |
| Resolution | Minimum 512 × 512 px; ideal 1024 × 1024 px |
| Background | White or transparent |
| Subject | Garment only — flat lay or invisible mannequin, front view |
| Lighting | Even, neutral — no harsh shadows |
| File size | Under 2 MB per image (optimize with `sharp` or similar) |
| Naming | `{styleCode}-front.png` (e.g. `sttu169-front.png`) |

### For thumbnails (sidebar grid):

| Property | Requirement |
|---|---|
| Resolution | 200 × 200 px |
| Format | WebP or JPEG |
| File size | Under 30 KB |
| Naming | `{styleCode}-thumb.webp` |

---

## 6. Phase 2: Dynamic catalogue from PIM

In Phase 2, the catalogue should be fetched from Stanley/Stella's Product Information Management (PIM) system or product feed API.

```typescript
// scripts/generate-catalogue.ts (build-time script)

// Fetch products from PIM API → transform to Product[] → write to catalogue.json
// This runs at build time (or via ISR) to avoid runtime API dependency

async function generateCatalogue() {
  const raw = await fetch(PIM_API_URL, { headers: { Authorization: PIM_API_KEY } });
  const pimProducts = await raw.json();

  const catalogue: Product[] = pimProducts.map(transformPimProduct);
  await fs.writeFile("src/data/catalogue.json", JSON.stringify(catalogue, null, 2));
}

function transformPimProduct(pim: PimProduct): Product {
  return {
    id: `${pim.name.toLowerCase().replace(/\s/g, "-")}-${pim.styleCode.toLowerCase()}`,
    styleCode: pim.styleCode,
    name: pim.name,
    category: mapCategory(pim.category),
    fit: pim.fit,
    fabricWeight: pim.weight,
    material: pim.composition,
    certifications: pim.certifications,
    garmentImageUrl: pim.frontImageUrl,
    thumbnailUrl: pim.thumbnailUrl,
    colors: pim.variants.map(v => ({
      name: v.colorName,
      hex: v.hexCode,
      pantone: v.pantone,
      garmentImageUrl: v.imageUrl,
    })),
    description: generateDescription(pim), // Derive from PIM metadata
    bodyArea: inferBodyArea(pim.category),
    gender: pim.gender,
    sizeRange: pim.sizeRange,
  };
}
```
