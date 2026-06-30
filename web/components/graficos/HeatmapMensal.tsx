"use client";
import type { Resumo } from "@/lib/types";

interface Props {
  resumos: Resumo[];
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Meses que fazem parte de uma temporada de verão (Oct-May)
const MESES_TEMPORADA = [10, 11, 12, 1, 2, 3, 4, 5];

function pctColor(pct: number | null): string {
  if (pct === null) return "bg-gray-100 text-gray-400";
  if (pct >= 80) return "bg-green-100 text-green-800";
  if (pct >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function buildHeatmap(resumos: Resumo[]) {
  // acumula por temporada+mes
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of resumos) {
    if (r.pct_proprias === null) continue;
    const mes = parseInt(r.data.split("-")[1]);
    const key = `${r.temporada}__${mes}`;
    if (!acc[key]) acc[key] = { sum: 0, count: 0 };
    acc[key].sum += r.pct_proprias;
    acc[key].count++;
  }

  const temporadas = Array.from(new Set(resumos.map((r) => r.temporada))).sort();
  return { temporadas, acc };
}

export function HeatmapMensal({ resumos }: Props) {
  const { temporadas, acc } = buildHeatmap(resumos);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
      <h2 className="font-semibold text-gray-800 mb-1">Heatmap por Mês e Temporada</h2>
      <p className="text-xs text-gray-500 mb-4">Média de pontos próprios por mês</p>
      <table className="text-xs min-w-full">
        <thead>
          <tr>
            <th className="text-left text-gray-500 font-medium pr-4 py-1">Temporada</th>
            {MESES_TEMPORADA.map((m) => (
              <th key={m} className="text-center text-gray-500 font-medium px-2 py-1 min-w-[52px]">
                {MESES[m - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {temporadas.map((t) => (
            <tr key={t}>
              <td className="text-gray-700 font-medium pr-4 py-1 whitespace-nowrap">{t}</td>
              {MESES_TEMPORADA.map((m) => {
                const key = `${t}__${m}`;
                const entry = acc[key];
                const pct = entry ? Math.round(entry.sum / entry.count) : null;
                return (
                  <td key={m} className="py-1 px-1 text-center">
                    {pct !== null ? (
                      <span className={`inline-block px-2 py-0.5 rounded font-medium ${pctColor(pct)}`}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-200"></span>≥ 80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-yellow-200"></span>60–79%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-200"></span>&lt; 60%
        </span>
      </div>
    </div>
  );
}
