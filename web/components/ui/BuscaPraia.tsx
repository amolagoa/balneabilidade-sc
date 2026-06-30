"use client";
import { useState, useMemo } from "react";
import type { Ponto } from "@/lib/types";
import { praiaPageSlug, statusColor } from "@/lib/utils";

interface Props {
  pontos: Ponto[];
}

interface GrupoPraia {
  slug: string;
  praia: string;
  municipio: string;
  municipio_slug: string;
  nProprias: number;
  nImproprias: number;
  nTotal: number;
  statusDominante: string | null;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function BuscaPraia({ pontos }: Props) {
  const [query, setQuery] = useState("");

  // Agrupa pontos por praia
  const grupos = useMemo<GrupoPraia[]>(() => {
    const map = new Map<string, GrupoPraia>();
    for (const p of pontos) {
      const slug = praiaPageSlug(p.municipio_slug, p.praia);
      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          praia: p.praia,
          municipio: p.municipio,
          municipio_slug: p.municipio_slug,
          nProprias: 0,
          nImproprias: 0,
          nTotal: 0,
          statusDominante: null,
        });
      }
      const g = map.get(slug)!;
      g.nTotal++;
      if (p.ultimo_status === "propria") g.nProprias++;
      if (p.ultimo_status === "impropria") g.nImproprias++;
    }
    // Determina status dominante de cada grupo
    Array.from(map.values()).forEach((g) => {
      g.statusDominante =
        g.nImproprias > 0 ? "impropria" :
        g.nProprias > 0 ? "propria" : null;
    });
    return Array.from(map.values());
  }, [pontos]);

  const resultados = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = normalize(query.trim());
    return grupos
      .filter((g) => normalize(g.praia + " " + g.municipio).includes(q))
      .slice(0, 8);
  }, [query, grupos]);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar praia ou município..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
        />
      </div>

      {resultados.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {resultados.map((g) => {
            const cor = statusColor(g.statusDominante);
            const emoji =
              g.statusDominante === "propria" ? "🟢" :
              g.statusDominante === "impropria" ? "🔴" : "⚪";
            return (
              <a
                key={g.slug}
                href={`/balneario/${g.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                onClick={() => setQuery("")}
              >
                <span className="text-lg shrink-0">{emoji}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{g.praia}</div>
                  <div className="text-xs text-gray-500">
                    {g.municipio}
                    {g.nTotal > 1 && (
                      <span className="ml-1 text-gray-400">· {g.nTotal} pontos</span>
                    )}
                  </div>
                </div>
                {g.nTotal > 1 && (
                  <span className="ml-auto text-xs shrink-0 font-medium" style={{ color: cor }}>
                    {g.nProprias}/{g.nTotal}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
