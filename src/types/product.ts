export type ProductCategory =
  | "tshirts"
  | "hoodies"
  | "jackets"
  | "polos"
  | "accessories";

export type Certification = "GOTS" | "GRS" | "PETA" | "FairWear" | "OCS";

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
  /** Garment description for VTON prompt generation */
  description: string;
  /** Target body area for prompt pattern */
  bodyArea: "top" | "bottoms" | "headwear" | "full-body";
  /** Gender targeting */
  gender: "unisex" | "men" | "women" | "kids";
  /** Size range — e.g. "XS–3XL" */
  sizeRange: string;
}
