import { getPontos, getPontoHistorico, formatDate } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MiniHistorico } from "@/components/graficos/MiniHistorico";
import { MapaPontos } from "@/components/mapa/MapaPontos";
import { HeatmapLagoa } from "@/components/graficos/HeatmapLagoa";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lagoa da Conceição — Balneabilidade | Florianópolis SC",
  description:
    "Dashboard completo de balneabilidade da Lagoa da Conceição em Florianópolis. 9 pontos monitorados com histórico desde 2023.",
  openGraph: {
    title: "Balneabilidade — Lagoa da Conceição · Florianópolis",
    description: "Status atual e histórico de todos os 9 pontos de monitoramento da Lagoa.",
  },
};

const LAGOA_IDS = [
  "ima_257", // Ponto 37
  "ima_258", // Ponto 38
  "ima_259", // Ponto 39
  "ima_260", // Ponto 41
  "ima_261", // Ponto 43
  "ima_262", // Ponto 61
  "ima_337", // Ponto 72
  "ima_390", // Ponto 96
  "ima_391", // Ponto 97
];

const LAGOA_CENTER: [number, number] = [-27.612, -48.462];

export default async function LagoaPage() {
  const pontos = await getPontos();
  const lagoaPontos = LAGOA_IDS.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;

  const historicos = await Promise.all(
    lagoaPontos.map((p) => getPontoHistorico(p.id).catch(() => ({ ponto: p, historico: [] })))
  );
  const historicosPorPonto = lagoaPontos.map((p) => {
    const h = historicos.find((h) => h.ponto.id === p.id);
    return h?.historico ?? [];
  });

  const nProprias = lagoaPontos.filter((p) => p.ultimo_status === "propria").length;
  const nImproprias = lagoaPontos.filter((p) => p.ultimo_status === "impropria").length;
  const improprias = lagoaPontos.filter((p) => p.ultimo_status === "impropria");

  const piorPonto = [...lagoaPontos]
    .filter((p) => p.pct_proprias_historico !== null)
    .sort((a, b) => (a.pct_proprias_historico ?? 100) - (b.pct_proprias_historico ?? 100))[0];

  const melhorPonto = [...lagoaPontos]
    .filter((p) => p.pct_proprias_historico !== null && p.total_coletas > 5)
    .sort((a, b) => (b.pct_proprias_historico ?? 0) - (a.pct_proprias_historico ?? 0))[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:text-teal-600">Início</a>
        <span>›</span>
        <a href="/municipio/florianopolis" className="hover:text-teal-600">Florianópolis</a>
        <span>›</span>
        <span className="text-gray-900 font-medium">Lagoa da Conceição</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lagoa da Conceição</h1>
          <p className="text-gray-500 text-sm mt-1">
            Florianópolis · {lagoaPontos.length} pontos monitorados · IMA/SC
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/lagoa/analise"
            className="text-sm text-white bg-teal-700 hover:bg-teal-800 px-3 py-1.5 rounded-lg font-medium"
          >
            📊 Análise por temporada
          </a>
          <a
            href="/praias"
            className="text-sm text-teal-600 hover:text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg"
          >
            🔍 Outras praias
          </a>
        </div>
      </div>

      {/* Status geral */}
      <div
        className={`rounded-xl border p-5 border-l-4 ${
          nImproprias === 0
            ? "bg-green-50 border-green-200 border-l-green-500"
            : "bg-amber-50 border-amber-200 border-l-amber-500"
        }`}
      >
        <div className="text-xl font-bold mb-1">
          {nImproprias === 0
            ? "✅ Todos os pontos próprios para banho"
            : `⚠️ ${nImproprias} ponto${nImproprias > 1 ? "s" : ""} impróprio${nImproprias > 1 ? "s" : ""} para banho`}
        </div>
        <div className="flex gap-5 text-sm mt-2 flex-wrap">
          <span className="text-green-700 font-medium">🟢 {nProprias} próprios</span>
          {nImproprias > 0 && (
            <span className="text-red-700 font-medium">🔴 {nImproprias} impróprios</span>
          )}
        </div>
        {improprias.length > 0 && (
          <div className="mt-3 space-y-1">
            {improprias.map((p) => (
              <a
                key={p.id}
                href={`/praia/${p.id}`}
                className="flex items-start gap-2 text-sm text-red-900 bg-red-100 rounded-lg px-3 py-2 hover:bg-red-200 transition-colors"
              >
                <span className="shrink-0">🚫</span>
                <span>
                  <strong>Ponto {p.ponto_num}</strong> — {p.descricao}
                  {p.ultima_coleta && (
                    <span className="text-red-600 ml-2 text-xs">
                      Coleta: {formatDate(p.ultima_coleta)}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Destaques históricos */}
      {(melhorPonto || piorPonto) && (
        <div className="grid grid-cols-2 gap-3">
          {melhorPonto && (
            <a href={`/praia/${melhorPonto.id}`} className="bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="text-xs text-green-700 font-medium uppercase tracking-wide">Ponto mais limpo</div>
              <div className="text-lg font-bold text-green-700 mt-1">{melhorPonto.pct_proprias_historico}%</div>
              <div className="text-xs text-green-600 mt-0.5">
                Ponto {melhorPonto.ponto_num} · {melhorPonto.total_coletas} coletas
              </div>
            </a>
          )}
          {piorPonto && (
            <a href={`/praia/${piorPonto.id}`} className="bg-red-50 border border-red-200 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="text-xs text-red-700 font-medium uppercase tracking-wide">Ponto mais problemático</div>
              <div className="text-lg font-bold text-red-700 mt-1">{piorPonto.pct_proprias_historico}%</div>
              <div className="text-xs text-red-600 mt-0.5">
                Ponto {piorPonto.ponto_num} · {piorPonto.total_coletas} coletas
              </div>
            </a>
          )}
        </div>
      )}

      {/* Mapa */}
      <div style={{ height: "380px" }}>
        <MapaPontos pontos={lagoaPontos} center={LAGOA_CENTER} zoom={13} />
      </div>

      {/* Grid de pontos */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Situação atual por ponto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lagoaPontos.map((p, i) => (
            <a
              key={p.id}
              href={`/praia/${p.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-semibold text-gray-900">Ponto {p.ponto_num}</div>
                <StatusBadge status={p.ultimo_status} size="sm" />
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{p.descricao}</p>

              {historicosPorPonto[i].length > 0 && (
                <MiniHistorico historico={historicosPorPonto[i]} maxItems={12} />
              )}

              <div className="flex justify-between mt-2 text-xs text-gray-400">
                {p.ultima_coleta && <span>Coleta: {formatDate(p.ultima_coleta)}</span>}
                {p.pct_proprias_historico !== null && (
                  <span>{p.pct_proprias_historico}% histórico</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Heatmap comparativo */}
      <HeatmapLagoa pontos={lagoaPontos} historicos={historicosPorPonto} />

      {/* Link para compartilhar */}
      <div className="flex gap-3 flex-wrap pb-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Confira a balneabilidade da Lagoa da Conceição em Florianópolis! https://balneabilidade-sc.vercel.app/lagoa")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          📱 Compartilhar no WhatsApp
        </a>
        <a
          href="/mapa"
          className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 border border-teal-200 text-sm px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors"
        >
          🗺️ Ver no mapa geral
        </a>
      </div>
    </div>
  );
}
