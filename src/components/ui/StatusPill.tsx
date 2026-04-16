"use client";

import type { ConnectionStatus } from "@/types/session";

interface StatusPillProps {
  status: ConnectionStatus;
}

const statusConfig: Record<
  ConnectionStatus,
  { label: string; dotClass: string; pillClass: string }
> = {
  idle: {
    label: "Idle",
    dotClass: "bg-brand-gray",
    pillClass: "bg-black/5 text-brand-gray",
  },
  connecting: {
    label: "Connecting",
    dotClass: "bg-yellow-500 animate-pulse",
    pillClass: "bg-yellow-50 text-yellow-700",
  },
  live: {
    label: "Live",
    dotClass: "bg-green-500 animate-pulse",
    pillClass: "bg-green-50 text-green-700",
  },
  reconnecting: {
    label: "Reconnecting",
    dotClass: "bg-yellow-500 animate-pulse",
    pillClass: "bg-yellow-50 text-yellow-700",
  },
  error: {
    label: "Error",
    dotClass: "bg-brand-error",
    pillClass: "bg-red-50 text-brand-error",
  },
};

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.pillClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
