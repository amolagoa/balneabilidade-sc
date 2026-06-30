"use client";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { praiaSlugFromPathname } from "@/lib/praias";
import type { Ponto, Medicao } from "@/lib/types";

interface PontoDados {
  ponto: Ponto;
  historico: Medicao[];
}

interface Relatorio {
  relatorio: number;
  temporada: string;
  data: string;
  key: string;
}

function extrairRelatorios(dados: PontoDados[]): Relatorio[] {
  const map = new Map<string, Relatorio>();
  dados.forEach(({ historico }) => {
    historico.forEach((m) => {
      if (!m.relatorio || !m.temporada) return;
      const key = `${m.temporada}_${m.relatorio}`;
      const existing = map.get(key);
      if (!existing || m.data > existing.data) {
        map.set(key, { relatorio: m.relatorio, temporada: m.temporada, data: m.data, key });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data));
}

function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function StatusChip({ status }: { status: "propria" | "impropria" | "indeterminado" | null }) {
  if (status === "propria")
    return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">🟢 Própria</span>;
  if (status === "impropria")
    return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">🔴 Imprópria</span>;
  return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">⚪ Sem dados</span>;
}

export function UltimoRelatorioClient({ dadosPorPonto }: { dadosPorPonto: PontoDados[] }) {
  const pathname = usePathname();
  const base = `/${praiaSlugFromPathname(pathname)}`;
  const relatorios = useMemo(() => extrairRelatorios(dadosPorPonto), [dadosPorPonto]);
  const [selectedKey, setSelectedKey] = useState(() => relatorios[0]?.key ?? "");

  const selected = useMemo(() => relatorios.find((r) => r.key === selectedKey) ?? relatorios[0], [relatorios, selectedKey]);

  const pontosNoRelatorio = useMemo(() => {
    if (!selected) return [];
    return dadosPorPonto.map(({ ponto, historico }) => {
      const medicao = historico.find(
        (m) => m.relatorio === selected.relatorio && m.temporada === selected.temporada
      );
      return { ponto, medicao, status: medicao?.status ?? null };
    });
  }, [dadosPorPonto, selected]);

  const nProprias = pontosNoRelatorio.filter((p) => p.status === "propria").length;
  const nImproprias = pontosNoRelatorio.filter((p) => p.status === "impropria").length;
  const nSemDados = pontosNoRelatorio.filter((p) => p.status === null).length;
  const totalComDados = nProprias + nImproprias;
  const pct = totalComDados > 0 ? Math.round((nProprias / totalComDados) * 100) : null;

  const statusGeral =
    nImproprias === 0 && totalComDados > 0 ? "proprio"
    : nProprias === 0 && totalComDados > 0 ? "improprio"
    : "misto";

  const isUltimo = selected?.key === relatorios[0]?.key;

  return (
    <div className="space-y-5">

      {/* Seletor de relatório */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Selecionar relatório
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800 font-medium"
            >
              {relatorios.map((r, i) => (
                <option key={r.key} value={r.key}>
                  {i === 0 ? "⭐ " : ""}Relatório #{r.relatorio} · {r.temporada} · {fmtData(r.data)}
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400">Temporada</div>
              <div className="text-sm font-bold text-gray-700">{selected.temporada}</div>
            </div>
          )}
        </div>
      </div>

      {/* Painel de status */}
      {selected && (
        <div className={`rounded-2xl border-2 p-5 ${
          statusGeral === "proprio" ? "bg-emerald-50 border-emerald-200"
          : statusGeral === "improprio" ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Relatório #{selected.relatorio} · {fmtData(selected.data)}
                {isUltimo && <span className="ml-2 bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded-full">MAIS RECENTE</span>}
              </div>
              <div className={`text-2xl font-bold ${
                statusGeral === "proprio" ? "text-emerald-800"
                : statusGeral === "improprio" ? "text-red-800"
                : "text-amber-800"
              }`}>
                {statusGeral === "proprio" ? "✅ Todos os pontos próprios"
                : statusGeral === "improprio" ? "🚫 Todos os pontos impróprios"
                : `⚠️ ${nImproprias} ponto${nImproprias > 1 ? "s" : ""} impróprio${nImproprias > 1 ? "s" : ""}`}
              </div>
            </div>
            {pct !== null && (
              <div className="text-right">
                <div className={`text-4xl font-black ${
                  pct >= 67 ? "text-emerald-700" : pct >= 34 ? "text-amber-700" : "text-red-700"
                }`}>
                  {pct}%
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${
                  pct >= 67 ? "text-emerald-600" : pct >= 34 ? "text-amber-600" : "text-red-600"
                }`}>
                  {pct >= 50 ? "Próprias" : "Impróprias"}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-3 text-sm flex-wrap">
            {nProprias > 0 && <span className="text-emerald-700 font-semibold">🟢 {nProprias} próprio{nProprias > 1 ? "s" : ""}</span>}
            {nImproprias > 0 && <span className="text-red-700 font-semibold">🔴 {nImproprias} impróprio{nImproprias > 1 ? "s" : ""}</span>}
            {nSemDados > 0 && <span className="text-gray-500">⚪ {nSemDados} sem dados</span>}
          </div>

          {pct !== null && totalComDados > 0 && (
            <div className="mt-3 h-2.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 67 ? "bg-emerald-500" : pct >= 34 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Grid de pontos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Situação dos pontos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pontosNoRelatorio.map(({ ponto, medicao, status }) => (
            <a
              key={ponto.id}
              href={`${base}/pontos`}
              className={`block rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                status === "propria" ? "bg-white border-emerald-200 hover:border-emerald-400"
                : status === "impropria" ? "bg-white border-red-200 hover:border-red-400"
                : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-bold text-gray-900">Ponto {ponto.ponto_num}</div>
                <StatusChip status={status as any} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{ponto.descricao}</p>
              {medicao?.nmp != null && (
                <div className="text-xs font-mono text-gray-400">
                  E. coli: <span className="font-semibold text-gray-600">{medicao.nmp.toLocaleString("pt-BR")} NMP/100mL</span>
                </div>
              )}
              {medicao?.chuva && (
                <div className="text-xs text-gray-400 mt-0.5">Chuva: {medicao.chuva}</div>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Nota */}
      <div className="text-xs text-gray-400 text-center pb-1">
        Lagoa da Conceição · IMA/SC · {relatorios.length} relatórios disponíveis (2022–2026)
      </div>
    </div>
  );
}
