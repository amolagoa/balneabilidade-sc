"use client";
import type { Municipio } from "@/lib/types";

interface Props {
  municipio: Municipio;
}

export function CardMunicipio({ municipio: m }: Props) {
  const total = m.n_proprias + m.n_improprias;
  const pct = total > 0 ? Math.round((m.n_proprias / total) * 100) : null;
  const cor = pct === null ? "bg-gray-200" : pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-400" : "bg-red-500";

  return (
    <a
      href={`/municipio/${m.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-teal-300 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{m.nome}</h3>
          <p className="text-xs text-gray-500">{m.n_pontos} pontos monitorados</p>
        </div>
        {pct !== null && (
          <span className={`text-sm font-bold px-2 py-0.5 rounded-full text-white ${cor}`}>
            {pct}%
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${cor}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>🟢 {m.n_proprias} próprias</span>
        <span>🔴 {m.n_improprias} impróprias</span>
      </div>
    </a>
  );
}
