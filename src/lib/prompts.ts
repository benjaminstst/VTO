import type { Product, ColorVariant } from "@/types/product";

/**
 * Build a VTON prompt from product + color selection.
 * Follows Decart's "Substitute the current {area} with..." pattern.
 */
export function buildVtonPrompt(
  product: Product,
  color: ColorVariant,
): string {
  const colorName = color.name.toLowerCase();
  const area =
    product.bodyArea === "top"
      ? "top"
      : product.bodyArea === "bottoms"
        ? "bottoms"
        : product.bodyArea === "headwear"
          ? "headwear"
          : "outfit";

  return `Substitute the current ${area} with a ${colorName} ${product.description}`;
}

/**
 * Enhanced prompt that includes material when visually relevant.
 */
export function buildEnhancedPrompt(
  product: Product,
  color: ColorVariant,
): string {
  const base = buildVtonPrompt(product, color);

  const visualMaterials = [
    "denim",
    "fleece",
    "corduroy",
    "velvet",
    "satin",
    "mesh",
    "knit",
  ];
  const hasVisualMaterial = visualMaterials.some((m) =>
    product.material.toLowerCase().includes(m),
  );

  if (hasVisualMaterial) {
    return `${base}, made from ${product.material.toLowerCase()}`;
  }

  return base;
}
