"use client";
import { useState } from "react";
import type { Resumo } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Props {
  resumos: Resumo[];
}

function BarraProgresso({ valor, total, cor }: { valor: number; total: number; cor: string }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PainelRelatorios({ resumos }: Props) {
  const sorted = [...resumos].sort((a, b) => b.data.localeCompare(a.data));
  const [selectedIdx, setSelectedIdx] = useState(0);

  const r = sorted[selectedIdx];
  const proprias = r.floripa_proprias + r.interior_proprias;
  const improprias = r.floripa_improprias + r.interior_improprias;
  const total = proprias + improprias;
  const pct = total > 0 ? Math.round((proprias / total) * 100) : null;

  const floripaPropTotal = r.floripa_proprias + r.floripa_improprias;
  const interiorTotal = r.interior_proprias + r.interior_improprias;

  const pctFloripa = floripaPropTotal > 0 ? Math.round((r.floripa_proprias / floripaPropTotal) * 100) : null;
  const pctInterior = interiorTotal > 0 ? Math.round((r.interior_proprias / interiorTotal) * 100) : null;

  const barColor =
    pct === null ? "bg-gray-300"
    : pct === 100 ? "bg-green-500"
    : pct >= 70 ? "bg-yellow-400"
    : "bg-red-500";

  const pctColor =
    pct === null ? "text-gray-400"
    : pct === 100 ? "text-green-700"
    : pct >= 70 ? "text-yellow-700"
    : "text-red-700";

  const pdfUrl = r.arquivo
    ? `https://balneabilidade.ima.sc.gov.br/relatorio/download/${r.arquivo}`
    : null;

  return (
    <div className="space-y-6">
      {/* Seletor de relatório */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar relatório
        </label>
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {sorted.map((rel, idx) => {
            const p = rel.floripa_proprias + rel.interior_proprias;
            const imp = rel.floripa_improprias + rel.interior_improprias;
            const tot = p + imp;
            const pctRel = tot > 0 ? Math.round((p / tot) * 100) : "—";
            return (
              <option key={`${rel.temporada}_${rel.relatorio}_${rel.data}`} value={idx}>
                Relatório #{rel.relatorio} — {rel.temporada} — {formatDate(rel.data)} ({pctRel}% próprias)
              </option>
            );
          })}
        </select>
      </div>

      {/* Cabeçalho do relatório */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Relatório N° {r.relatorio}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Temporada {r.temporada} · {formatDate(r.data)}
            </p>
          </div>
          <div className="flex gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors font-medium"
              >
                📄 Ver PDF original
              </a>
            )}
          </div>
        </div>

        {/* Percentual geral */}
        {pct !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4 text-sm">
                <span className="text-green-700 font-medium">
                  🟢 {proprias} próprias
                </span>
                <span className="text-red-700 font-medium">
                  🔴 {improprias} impróprias
                </span>
                <span className="text-gray-500">
                  {total} pontos monitorados
                </span>
              </div>
              <span className={`text-2xl font-bold ${pctColor}`}>{pct}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {pct}% dos pontos monitorados estavam próprios para banho neste relatório
            </p>
          </div>
        )}
      </div>

      {/* Breakdown Florianópolis vs Interior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Florianópolis */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Florianópolis</h3>
              <p className="text-xs text-gray-500 mt-0.5">{floripaPropTotal} pontos monitorados</p>
            </div>
            {pctFloripa !== null && (
              <span className={`text-xl font-bold ${pctFloripa >= 70 ? "text-green-700" : pctFloripa >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                {pctFloripa}%
              </span>
            )}
          </div>
          <BarraProgresso
            valor={r.floripa_proprias}
            total={floripaPropTotal}
            cor={pctFloripa !== null && pctFloripa >= 70 ? "bg-green-500" : pctFloripa !== null && pctFloripa >= 50 ? "bg-yellow-400" : "bg-red-500"}
          />
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-700">{r.floripa_proprias} próprias</span>
            <span className="text-red-700">{r.floripa_improprias} impróprias</span>
          </div>
        </div>

        {/* Interior */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Interior</h3>
              <p className="text-xs text-gray-500 mt-0.5">{interiorTotal} pontos monitorados</p>
            </div>
            {pctInterior !== null && (
              <span className={`text-xl font-bold ${pctInterior >= 70 ? "text-green-700" : pctInterior >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                {pctInterior}%
              </span>
            )}
          </div>
          <BarraProgresso
            valor={r.interior_proprias}
            total={interiorTotal}
            cor={pctInterior !== null && pctInterior >= 70 ? "bg-green-500" : pctInterior !== null && pctInterior >= 50 ? "bg-yellow-400" : "bg-red-500"}
          />
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-700">{r.interior_proprias} próprias</span>
            <span className="text-red-700">{r.interior_improprias} impróprias</span>
          </div>
        </div>
      </div>

      {/* Comparativo com relatórios anteriores */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Últimos 8 relatórios — % próprias</h3>
        <div className="flex items-end gap-2 h-24">
          {sorted.slice(0, 8).reverse().map((rel, idx) => {
            const p = rel.floripa_proprias + rel.interior_proprias;
            const imp = rel.floripa_improprias + rel.interior_improprias;
            const t = p + imp;
            const pctRel = t > 0 ? (p / t) * 100 : 0;
            const isSelected = sorted.indexOf(rel) === selectedIdx;
            const barCor = pctRel >= 70 ? "bg-green-400" : pctRel >= 50 ? "bg-yellow-400" : "bg-red-400";
            return (
              <button
                key={`${rel.temporada}_${rel.relatorio}_${rel.data}_bar`}
                onClick={() => setSelectedIdx(sorted.indexOf(rel))}
                className="flex-1 flex flex-col items-center gap-1 group"
                title={`Rel. #${rel.relatorio} — ${formatDate(rel.data)}: ${Math.round(pctRel)}%`}
              >
                <span className={`text-xs font-bold ${isSelected ? "text-teal-700" : "text-gray-400"}`}>
                  {Math.round(pctRel)}%
                </span>
                <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(4, pctRel * 0.7)}px` }}>
                  <div className={`w-full h-full rounded-t-sm ${barCor} ${isSelected ? "ring-2 ring-teal-500" : "opacity-70 group-hover:opacity-100"}`} />
                </div>
                <span className={`text-[10px] ${isSelected ? "text-teal-700 font-bold" : "text-gray-400"}`}>
                  #{rel.relatorio}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">Clique numa barra para selecionar o relatório</p>
      </div>
    </div>
  );
}
