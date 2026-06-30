"use client";
import type { Status } from "@/lib/types";

const config = {
  propria: { label: "Própria", emoji: "🟢", bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  impropria: { label: "Imprópria", emoji: "🔴", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  indeterminado: { label: "Sem dados", emoji: "⚪", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
};

interface Props {
  status: Status | null;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status ?? "indeterminado"];
  const sz = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-2 font-semibold" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${c.bg} ${c.text} ${c.border} ${sz}`}>
      <span>{c.emoji}</span>
      {c.label}
    </span>
  );
}
