"use client";

import { useState } from "react";
import { Check, Shirt } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage =
    product.thumbnailUrl &&
    !product.thumbnailUrl.startsWith("/images/products/") &&
    !imgError;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
        isSelected
          ? "border-brand-green shadow-md"
          : "border-black/10 hover:border-black/20"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        {hasImage ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 150px"
            className="object-contain p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-10 w-10 text-brand-gray/40" strokeWidth={1.5} />
          </div>
        )}
        {isSelected && (
          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <span className="truncate text-xs font-medium text-brand-charcoal">
          {product.name}
        </span>
        <span className="text-[10px] text-brand-gray">
          {product.styleCode} &middot; {product.fit} &middot;{" "}
          {product.fabricWeight}
        </span>
      </div>
    </button>
  );
}
