"use client";
import { useState, useMemo } from "react";
import type { Ponto, Municipio, Medicao } from "@/lib/types";
import { praiaPageSlug, formatDate, statusColor } from "@/lib/utils";
import { MiniHistorico } from "@/components/graficos/MiniHistorico";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Props {
  pontos: Ponto[];
  municipios: Municipio[];
}

interface GrupoPraia {
  slug: string;
  praia: string;
  municipio: string;
  municipio_slug: string;
  pontos: Ponto[];
  nProprias: number;
  nImproprias: number;
}

interface HistoricoMap {
  [pontoId: string]: Medicao[];
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function PainelPraias({ pontos, municipios }: Props) {
  const [query, setQuery] = useState("");
  const [filtroMun, setFiltroMun] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [historicos, setHistoricos] = useState<HistoricoMap>({});
  const [loading, setLoading] = useState(false);

  const praias = useMemo<GrupoPraia[]>(() => {
    const map = new Map<string, GrupoPraia>();
    for (const p of pontos) {
      const slug = praiaPageSlug(p.municipio_slug, p.praia);
      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          praia: p.praia,
          municipio: p.municipio,
          municipio_slug: p.municipio_slug,
          pontos: [],
          nProprias: 0,
          nImproprias: 0,
        });
      }
      const g = map.get(slug)!;
      g.pontos.push(p);
      if (p.ultimo_status === "propria") g.nProprias++;
      if (p.ultimo_status === "impropria") g.nImproprias++;
    }
    return Array.from(map.values());
  }, [pontos]);

  const praiasFiltradas = useMemo(() => {
    const q = normalize(query.trim());
    return praias.filter((g) => {
      if (q.length >= 2 && !normalize(g.praia + " " + g.municipio).includes(q)) return false;
      if (filtroMun !== "todos" && g.municipio_slug !== filtroMun) return false;
      if (filtroStatus === "propria" && g.nImproprias > 0) return false;
      if (filtroStatus === "impropria" && g.nImproprias === 0) return false;
      return true;
    });
  }, [praias, query, filtroMun, filtroStatus]);

  async function selecionarPraia(grupo: GrupoPraia) {
    if (grupo.slug === selectedSlug) return;
    setSelectedSlug(grupo.slug);
    setLoading(true);
    const results = await Promise.all(
      grupo.pontos.map(async (p) => {
        try {
          const res = await fetch(`/data/por_ponto/${p.id}.json`);
          const data = await res.json();
          return { id: p.id, historico: data.historico as Medicao[] };
        } catch {
          return { id: p.id, historico: [] };
        }
      })
    );
    const mapa: HistoricoMap = {};
    results.forEach(({ id, historico }) => { mapa[id] = historico; });
    setHistoricos(mapa);
    setLoading(false);
  }

  const grupoPraia = praias.find((g) => g.slug === selectedSlug);

  return (
    <div className="flex flex-col lg:flex-row gap-4">

      {/* ── ESQUERDA: filtros + lista ── */}
      <div className="lg:w-2/5 flex flex-col gap-3 shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Buscar praia ou município..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-2">
            <select
              value={filtroMun}
              onChange={(e) => setFiltroMun(e.target.value)}
              className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="todos">Todos os municípios</option>
              {municipios.map((m) => (
                <option key={m.slug} value={m.slug}>{m.nome}</option>
              ))}
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none shrink-0"
            >
              <option value="todos">Todas</option>
              <option value="propria">✅ Todas próprias</option>
              <option value="impropria">🚫 Com impróprias</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">{praiasFiltradas.length} de {praias.length} praias</p>
        </div>

        <div
          className="bg-white rounded-xl border border-gray-200 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 340px)", minHeight: "260px" }}
        >
          {praiasFiltradas.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Nenhuma praia encontrada</div>
          ) : (
            praiasFiltradas.map((g) => {
              const temImpropria = g.nImproprias > 0;
              const cor = temImpropria ? "#dc2626" : g.nProprias > 0 ? "#16a34a" : "#9ca3af";
              const total = g.nProprias + g.nImproprias;
              const pct = total > 0 ? Math.round((g.nProprias / total) * 100) : null;
              const ativo = g.slug === selectedSlug;
              return (
                <button
                  key={g.slug}
                  onClick={() => selecionarPraia(g)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors hover:bg-teal-50 ${ativo ? "bg-teal-50 border-l-4 border-l-teal-500" : ""}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate">{g.praia}</div>
                    <div className="text-xs text-gray-500 truncate">{g.municipio}</div>
                  </div>
                  <div className="text-xs shrink-0 text-right space-y-0.5">
                    {g.pontos.length > 1 && (
                      <div className="text-gray-400">{g.pontos.length} pts</div>
                    )}
                    {pct !== null && (
                      <div className={`font-semibold ${temImpropria ? "text-red-600" : "text-green-600"}`}>
                        {pct}%
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── DIREITA: painel de detalhes ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedSlug && (
          <div className="h-64 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm px-6 text-center">
            ← Selecione uma praia na lista para ver os pontos de monitoramento
          </div>
        )}

        {loading && (
          <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Carregando dados...
            </div>
          </div>
        )}

        {!loading && grupoPraia && (() => {
          const total = grupoPraia.nProprias + grupoPraia.nImproprias;
          const pct = total > 0 ? Math.round((grupoPraia.nProprias / total) * 100) : null;
          const barColor = pct === null ? "bg-gray-200" : pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500";
          const pctColor = pct === null ? "text-gray-400" : pct === 100 ? "text-green-700" : pct >= 50 ? "text-yellow-700" : "text-red-700";
          return (
            <>
              {/* Cabeçalho */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{grupoPraia.praia}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {grupoPraia.municipio} · {grupoPraia.pontos.length} ponto{grupoPraia.pontos.length > 1 ? "s" : ""} de monitoramento
                    </p>
                  </div>
                  <a
                    href={`/balneario/${grupoPraia.slug}`}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium whitespace-nowrap shrink-0 mt-1"
                  >
                    Página completa →
                  </a>
                </div>

                {/* Percentual + barra */}
                {pct !== null && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-4 text-sm">
                        {grupoPraia.nProprias > 0 && (
                          <span className="text-green-700 font-medium">
                            🟢 {grupoPraia.nProprias} próprio{grupoPraia.nProprias > 1 ? "s" : ""}
                            <span className="text-green-600 font-normal ml-1">
                              ({Math.round((grupoPraia.nProprias / total) * 100)}%)
                            </span>
                          </span>
                        )}
                        {grupoPraia.nImproprias > 0 && (
                          <span className="text-red-700 font-medium">
                            🔴 {grupoPraia.nImproprias} impróprio{grupoPraia.nImproprias > 1 ? "s" : ""}
                            <span className="text-red-600 font-normal ml-1">
                              ({Math.round((grupoPraia.nImproprias / total) * 100)}%)
                            </span>
                          </span>
                        )}
                      </div>
                      <span className={`text-xl font-bold ${pctColor}`}>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </>
                )}
              </div>

              {/* Cards de cada ponto */}
              <div className="space-y-3">
                {grupoPraia.pontos.map((p) => {
                  const hist = historicos[p.id] ?? [];
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {p.ponto_num ? `Ponto ${p.ponto_num}` : p.praia}
                          </div>
                          {p.descricao && (
                            <div className="text-xs text-gray-500 mt-0.5">{p.descricao}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={p.ultimo_status} size="sm" />
                          <a href={`/praia/${p.id}`} className="text-xs text-teal-600 hover:text-teal-800">
                            detalhes →
                          </a>
                        </div>
                      </div>
                      {hist.length > 0 ? (
                        <>
                          <MiniHistorico historico={hist} maxItems={20} />
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            {p.ultima_coleta && <span>Última coleta: {formatDate(p.ultima_coleta)}</span>}
                            {p.pct_proprias_historico !== null && (
                              <span>{p.pct_proprias_historico}% próprias no histórico</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">Sem histórico disponível</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
