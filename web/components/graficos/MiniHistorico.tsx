"use client";
import type { Medicao } from "@/lib/types";
import { formatDate, statusColor } from "@/lib/utils";

interface Props {
  historico: Medicao[];
  maxItems?: number;
}

export function MiniHistorico({ historico, maxItems = 20 }: Props) {
  const items = [...historico].reverse().slice(0, maxItems);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((m, i) => {
          const cor = statusColor(m.status);
          const label = m.status === "propria" ? "Própria" : m.status === "impropria" ? "Imprópria" : "Sem dados";
          return (
            <div
              key={i}
              className="group relative"
              title={`${formatDate(m.data)}: ${label}`}
            >
              <div
                className="w-5 h-5 rounded-full cursor-default transition-transform group-hover:scale-125"
                style={{ backgroundColor: cor, border: "2px solid white", boxShadow: "0 0 0 1px " + cor }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {formatDate(m.data)}: {label}
                {m.nmp ? ` (${m.nmp} NMP)` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2">← Mais recente · Passe o mouse para ver a data</p>
    </div>
  );
}
