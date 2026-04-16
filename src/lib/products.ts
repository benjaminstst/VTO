import type { Product, ProductCategory } from "@/types/product";
import catalogue from "@/data/catalogue.json";

const products = catalogue as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.styleCode.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}

export function getCategories(): ProductCategory[] {
  return ["tshirts", "hoodies", "jackets", "polos", "accessories"];
}

export function getCategoryLabel(category: ProductCategory): string {
  const labels: Record<ProductCategory, string> = {
    tshirts: "T-Shirts",
    hoodies: "Hoodies",
    jackets: "Jackets",
    polos: "Polos",
    accessories: "Accessories",
  };
  return labels[category];
}
