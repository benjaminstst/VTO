"use client";

import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  selectedProductId: string | null;
  onSelectProduct: (product: Product) => void;
}

export function ProductGrid({
  products,
  selectedProductId,
  onSelectProduct,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-brand-gray">
        No products found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={product.id === selectedProductId}
          onSelect={() => onSelectProduct(product)}
        />
      ))}
    </div>
  );
}
