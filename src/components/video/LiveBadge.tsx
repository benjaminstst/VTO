"use client";

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      LIVE
    </span>
  );
}
