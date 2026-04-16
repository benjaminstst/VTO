"use client";

import { Check } from "lucide-react";

interface ColorSwatchProps {
  hex: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

export function ColorSwatch({ hex, name, isSelected, onClick }: ColorSwatchProps) {
  const light = isLightColor(hex);
  return (
    <button
      type="button"
      onClick={onClick}
      title={name}
      aria-label={`Select color ${name}`}
      aria-pressed={isSelected}
      className={`relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 ${
        isSelected ? "border-brand-charcoal scale-110" : "border-transparent"
      } ${light ? "ring-1 ring-inset ring-black/10" : ""}`}
      style={{ backgroundColor: hex }}
    >
      {isSelected && (
        <Check
          className={`absolute inset-0 m-auto h-4 w-4 ${
            light ? "text-brand-charcoal" : "text-white"
          }`}
          strokeWidth={3}
        />
      )}
    </button>
  );
}
