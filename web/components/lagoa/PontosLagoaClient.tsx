"use client";
import { useState } from "react";
import type { Ponto, Medicao } from "@/lib/types";

interface PontoDados {
  ponto: Ponto;
  historico: Medicao[];
}

function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function MiniBar({ historico }: { historico: Medicao[] }) {
  const ultimas = [...historico].slice(-24);
  return (
    <div className="flex gap-1 flex-wrap">
      {ultimas.map((m, i) => {
        const label =
          m.status === "propria" ? "Própria"
          : m.status === "impropria" ? "Imprópria"
          : "Indeterminado";
        const labelColor =
          m.status === "propria" ? "text-emerald-300"
          : m.status === "impropria" ? "text-red-300"
          : "text-gray-400";
        const bgColor =
          m.status === "propria" ? "bg-emerald-400"
          : m.status === "impropria" ? "bg-red-400"
          : "bg-gray-200";
        return (
          <div key={i} className="relative group">
            <div className={`w-4 h-4 rounded-sm cursor-default ${bgColor}`} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 invisible group-hover:visible pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center">
                <div className="font-semibold">{fmtData(m.data)}</div>
                <div className={labelColor}>{label}</div>
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 mx-auto" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PctRing({ pct }: { pct: number }) {
  const color = pct >= 67 ? "#059669" : pct >= 34 ? "#d97706" : "#dc2626";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const stroke = (pct / 100) * circ;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${stroke} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold leading-tight" style={{ color }}>{pct}%</span>
        <span className="text-[8px] leading-tight" style={{ color }}>{pct >= 50 ? "Próprias" : "Impróprias"}</span>
      </div>
    </div>
  );
}

type Ordem = "pct_desc" | "pct_asc" | "ponto";

export function PontosLagoaClient({ dadosPorPonto }: { dadosPorPonto: PontoDados[] }) {
  const [ordem, setOrdem] = useState<Ordem>("ponto");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTemp, setExpandedTemp] = useState<string | null>(null);

  function toggleTemp(pontoId: string, temp: string) {
    const key = `${pontoId}__${temp}`;
    setExpandedTemp((prev) => (prev === key ? null : key));
  }

  const comStats = dadosPorPonto.map(({ ponto, historico }) => {
    const proprias = historico.filter((m) => m.status === "propria").length;
    const improprias = historico.filter((m) => m.status === "impropria").length;
    const total = proprias + improprias;
    const pct = total > 0 ? Math.round((proprias / total) * 100) : null;
    const ultima = historico.at(-1);
    return { ponto, historico, proprias, improprias, total, pct, ultima };
  });

  const ordenados = [...comStats].sort((a, b) => {
    if (ordem === "pct_desc") return (b.pct ?? -1) - (a.pct ?? -1);
    if (ordem === "pct_asc") return (a.pct ?? 101) - (b.pct ?? 101);
    return (a.ponto.ponto_num ?? 0) - (b.ponto.ponto_num ?? 0);
  });

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar:</span>
        {([ ["ponto", "Nº do ponto"], ["pct_desc", "Mais limpo primeiro"], ["pct_asc", "Mais problemático primeiro"] ] as [Ordem, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setOrdem(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              ordem === val
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards dos pontos */}
      <div className="space-y-3">
        {ordenados.map(({ ponto, historico, proprias, improprias, total, pct, ultima }) => {
          const isExpanded = expanded === ponto.id;
          const statusAtual = ultima?.status ?? null;

          return (
            <div
              key={ponto.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                statusAtual === "propria" ? "border-emerald-200"
                : statusAtual === "impropria" ? "border-red-200"
                : "border-gray-200"
              }`}
            >
              {/* Cabeçalho do card */}
              <button
                className="w-full text-left p-4 flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : ponto.id)}
              >
                {pct !== null ? (
                  <PctRing pct={pct} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                    —
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">Ponto {ponto.ponto_num}</span>
                    {statusAtual === "propria" && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">🟢 Própria</span>
                    )}
                    {statusAtual === "impropria" && (
                      <span className="text-[11px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">🔴 Imprópria</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ponto.descricao}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{total} coletas</span>
                    <span className="text-emerald-600">{proprias} ✓</span>
                    <span className="text-red-500">{improprias} ✗</span>
                    {ultima && <span>Última: {fmtData(ultima.data)}</span>}
                  </div>
                </div>

                <div className={`text-gray-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Histórico expandido */}
              {isExpanded && (
                <div className="px-4 pb-5 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    {/* Barra de proporção */}
                    {total > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>{proprias} próprias ({pct}%)</span>
                          <span>{improprias} impróprias ({100 - (pct ?? 0)}%)</span>
                        </div>
                        <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Mini histórico visual */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Histórico — últimas 24 coletas</div>
                      <MiniBar historico={historico} />
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" /> Própria</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Imprópria</span>
                      </div>
                    </div>

                    {/* Histórico por temporada */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Por temporada — clique para ver as coletas</div>
                      <div className="space-y-1">
                        {Array.from(new Set(historico.map(m => m.temporada).filter(Boolean)))
                          .sort((a, b) => (b ?? "").localeCompare(a ?? ""))
                          .map((temp) => {
                            const th = historico.filter(m => m.temporada === temp).sort((a, b) => a.data.localeCompare(b.data));
                            const tp = th.filter(m => m.status === "propria").length;
                            const tt = th.filter(m => m.status !== "indeterminado").length;
                            const tpct = tt > 0 ? Math.round((tp / tt) * 100) : null;
                            const tcolor = tpct === null ? "bg-gray-300" : tpct >= 67 ? "bg-emerald-500" : tpct >= 34 ? "bg-amber-400" : "bg-red-500";
                            const tempKey = `${ponto.id}__${temp}`;
                            const isOpen = expandedTemp === tempKey;
                            return (
                              <div key={temp}>
                                <button
                                  onClick={() => toggleTemp(ponto.id, temp ?? "")}
                                  className="w-full flex items-center gap-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <span className="text-xs text-gray-600 w-20 shrink-0 text-left">{temp}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${tcolor}`} style={{ width: `${tpct ?? 0}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                                    {tpct !== null ? `${tpct}%` : "—"}
                                  </span>
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {isOpen && (
                                  <div className="mt-2 mb-1 pl-[92px]">
                                    <MiniBar historico={th} />
                                    <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" /> Própria</span>
                                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Imprópria</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 text-center pb-1">
        Clique em um ponto para ver o histórico detalhado · IMA/SC
      </div>
    </div>
  );
}
