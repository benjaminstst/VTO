"use client";

import { useMemo } from "react";
import { SegmentControl } from "@/components/ui/SegmentControl";
import { SearchInput } from "@/components/ui/SearchInput";
import { ProductGrid } from "./ProductGrid";
import { ColorPicker } from "./ColorPicker";
import { PromptEditor } from "./PromptEditor";
import { SessionControls } from "./SessionControls";
import { ApiKeyInput } from "./ApiKeyInput";
import { useTryOnStore } from "@/stores/tryonStore";
import {
  getProductsByCategory,
  searchProducts,
  getCategories,
  getCategoryLabel,
} from "@/lib/products";
import type { ProductCategory } from "@/types/product";

const categorySegments = getCategories().map((cat) => ({
  value: cat,
  label: getCategoryLabel(cat),
}));

interface SidebarProps {
  onStart: () => void;
  onStop: () => void;
  onDevApiKey: (key: string) => void;
}

export function Sidebar({ onStart, onStop, onDevApiKey }: SidebarProps) {
  const {
    selectedProduct,
    selectedColor,
    activeCategory,
    searchQuery,
    selectProduct,
    selectColor,
    setActiveCategory,
    setSearchQuery,
  } = useTryOnStore();

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim()) {
      return searchProducts(searchQuery);
    }
    return getProductsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-white p-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-lg font-semibold text-brand-charcoal">
          Virtual Try-On
        </h1>
        <p className="text-xs text-brand-gray">
          Select a garment to try on
        </p>
      </div>

      {/* Dev mode API key input */}
      <ApiKeyInput onApiKeySet={onDevApiKey} />

      {/* Session controls */}
      <SessionControls onStart={onStart} onStop={onStop} />

      {/* Search */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {/* Category tabs */}
      {!searchQuery && (
        <SegmentControl<ProductCategory>
          segments={categorySegments}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      {/* Product grid */}
      <ProductGrid
        products={filteredProducts}
        selectedProductId={selectedProduct?.id ?? null}
        onSelectProduct={selectProduct}
      />

      {/* Color picker (shown when a product is selected) */}
      {selectedProduct && (
        <ColorPicker
          colors={selectedProduct.colors}
          selectedColor={selectedColor}
          onSelectColor={selectColor}
        />
      )}

      {/* Prompt editor (shown when a product is selected) */}
      <PromptEditor />
    </aside>
  );
}
