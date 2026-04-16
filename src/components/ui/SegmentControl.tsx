"use client";

interface SegmentControlProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentControlProps<T>) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-black/5 p-1"
      role="tablist"
      aria-label="Category filter"
    >
      {segments.map((segment) => {
        const isActive = segment.value === value;
        return (
          <button
            key={segment.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(segment.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-brand-charcoal shadow-sm"
                : "text-brand-gray hover:text-brand-charcoal"
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
