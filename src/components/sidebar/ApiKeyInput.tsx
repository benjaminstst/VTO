"use client";

import { useState } from "react";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (key: string) => void;
}

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [key, setKey] = useState("");

  if (!IS_DEV_MODE) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySet(key.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 text-xs font-medium text-brand-gray">
        <Key className="h-3.5 w-3.5" />
        Dev Mode — API Key
      </label>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-... or ek_..."
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-charcoal placeholder:text-brand-gray focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
        <button
          type="submit"
          disabled={!key.trim()}
          className="rounded-lg bg-brand-green px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Set
        </button>
      </div>
    </form>
  );
}
