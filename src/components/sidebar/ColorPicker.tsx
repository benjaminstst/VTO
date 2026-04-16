"use client";

import { ColorSwatch } from "@/components/ui/ColorSwatch";
import type { ColorVariant } from "@/types/product";

interface ColorPickerProps {
  colors: ColorVariant[];
  selectedColor: ColorVariant | null;
  onSelectColor: (color: ColorVariant) => void;
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelectColor,
}: ColorPickerProps) {
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-gray">Color</span>
        {selectedColor && (
          <span className="text-xs text-brand-charcoal">
            {selectedColor.name}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <ColorSwatch
            key={color.hex}
            hex={color.hex}
            name={color.name}
            isSelected={selectedColor?.hex === color.hex}
            onClick={() => onSelectColor(color)}
          />
        ))}
      </div>
    </div>
  );
}
