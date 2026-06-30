import { getPontos, getPontoHistorico, formatDate } from "@/lib/data";
import { praiaPageSlug } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MiniHistorico } from "@/components/graficos/MiniHistorico";
import { MapaPontos } from "@/components/mapa/MapaPontos";
import { HeatmapLagoa } from "@/components/graficos/HeatmapLagoa";
import { GraficoHistoricoPonto } from "@/components/graficos/GraficoHistoricoPonto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const pontos = await getPontos();
  const seen = new Set<string>();
  const params: { slug: string }[] = [];
  for (const p of pontos) {
    const slug = praiaPageSlug(p.municipio_slug, p.praia);
    if (!seen.has(slug)) {
      seen.add(slug);
      params.push({ slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pontos = await getPontos();
  const grupo = pontos.filter((p) => praiaPageSlug(p.municipio_slug, p.praia) === params.slug);
  if (!grupo.length) return {};
  const p0 = grupo[0];
  const nProprias = grupo.filter((p) => p.ultimo_status === "propria").length;
  const statusStr = nProprias === grupo.length ? "✅ Todos próprios" : `⚠️ ${grupo.length - nProprias} impróprio(s)`;
  return {
    title: `${p0.praia} — ${p0.municipio} | Balneabilidade SC`,
    description: `${statusStr} · ${grupo.length} ponto${grupo.length > 1 ? "s" : ""} monitorado${grupo.length > 1 ? "s" : ""} em ${p0.municipio}.`,
    openGraph: {
      title: `${p0.praia} · ${p0.municipio}`,
      description: `${nProprias}/${grupo.length} pontos próprios para banho`,
    },
  };
}

export default async function BalnearioPage({ params }: Props) {
  const pontos = await getPontos();
  const grupo = pontos.filter((p) => praiaPageSlug(p.municipio_slug, p.praia) === params.slug);
  if (!grupo.length) notFound();

  const p0 = grupo[0];

  // Históricos de todos os pontos do grupo
  const historicos = await Promise.all(
    grupo.map((p) => getPontoHistorico(p.id).catch(() => ({ ponto: p, historico: [] })))
  );
  const historicosPorPonto = grupo.map((p) =>
    historicos.find((h) => h.ponto.id === p.id)?.historico ?? []
  );
  const todosHistorico = historicosPorPonto.flat();

  const nProprias = grupo.filter((p) => p.ultimo_status === "propria").length;
  const nImproprias = grupo.filter((p) => p.ultimo_status === "impropria").length;
  const improprias = grupo.filter((p) => p.ultimo_status === "impropria");

  const comCoordenadas = grupo.filter((p) => p.lat && p.lon);
  const center: [number, number] = comCoordenadas.length
    ? [
        comCoordenadas.reduce((s, p) => s + p.lat!, 0) / comCoordenadas.length,
        comCoordenadas.reduce((s, p) => s + p.lon!, 0) / comCoordenadas.length,
      ]
    : [-27.5, -48.5];
  const zoom = grupo.length === 1 ? 15 : grupo.length <= 3 ? 14 : 13;

  const whatsappMsg = encodeURIComponent(
    `${p0.praia} (${p0.municipio}): ${nProprias}/${grupo.length} pontos próprios para banho. Confira: https://balneabilidade-sc.vercel.app/balneario/${params.slug}`
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:text-teal-600">Início</a>
        <span>›</span>
        <a href={`/municipio/${p0.municipio_slug}`} className="hover:text-teal-600">{p0.municipio}</a>
        <span>›</span>
        <span className="text-gray-900 font-medium">{p0.praia}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{p0.praia}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {p0.municipio} · {grupo.length} ponto{grupo.length > 1 ? "s" : ""} de monitoramento
          </p>
        </div>
        <a
          href={`https://wa.me/?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium shrink-0"
        >
          📱 Compartilhar
        </a>
      </div>

      {/* Status geral */}
      <div
        className={`rounded-xl border p-5 border-l-4 ${
          nImproprias === 0
            ? "bg-green-50 border-green-200 border-l-green-500"
            : nProprias === 0
            ? "bg-red-50 border-red-200 border-l-red-500"
            : "bg-amber-50 border-amber-200 border-l-amber-500"
        }`}
      >
        <div className="text-xl font-bold mb-1">
          {nImproprias === 0
            ? grupo.length === 1
              ? "✅ Própria para banho"
              : "✅ Todos os pontos próprios para banho"
            : nProprias === 0
            ? grupo.length === 1
              ? "🚫 Imprópria para banho"
              : "🚫 Todos os pontos impróprios"
            : `⚠️ ${nImproprias} de ${grupo.length} pontos impróprios`}
        </div>
        <div className="flex gap-5 text-sm mt-2 flex-wrap">
          {nProprias > 0 && <span className="text-green-700 font-medium">🟢 {nProprias} próprio{nProprias > 1 ? "s" : ""}</span>}
          {nImproprias > 0 && <span className="text-red-700 font-medium">🔴 {nImproprias} impróprio{nImproprias > 1 ? "s" : ""}</span>}
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
                  {p.ponto_num ? <strong>Ponto {p.ponto_num}</strong> : <strong>{p.praia}</strong>}
                  {p.descricao ? ` — ${p.descricao}` : ""}
                  {p.ultima_coleta && (
                    <span className="text-red-600 ml-2 text-xs">Coleta: {formatDate(p.ultima_coleta)}</span>
                  )}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      {comCoordenadas.length > 0 && (
        <div style={{ height: grupo.length === 1 ? "300px" : "360px" }}>
          <MapaPontos pontos={grupo} center={center} zoom={zoom} />
        </div>
      )}

      {/* Ponto único: mostra histórico completo direto */}
      {grupo.length === 1 && (
        <>
          {historicosPorPonto[0].length >= 5 && (
            <GraficoHistoricoPonto historico={historicosPorPonto[0]} />
          )}
          {historicosPorPonto[0].length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm">
                Histórico ({historicosPorPonto[0].length} coletas)
              </h2>
              <MiniHistorico historico={historicosPorPonto[0]} maxItems={30} />
            </div>
          )}
        </>
      )}

      {/* Múltiplos pontos: grid de cards */}
      {grupo.length > 1 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Pontos de monitoramento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grupo.map((p, i) => (
              <a
                key={p.id}
                href={`/praia/${p.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-gray-900 text-sm">
                    {p.ponto_num ? `Ponto ${p.ponto_num}` : p.praia}
                  </div>
                  <StatusBadge status={p.ultimo_status} size="sm" />
                </div>
                {p.descricao && (
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{p.descricao}</p>
                )}
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
      )}

      {/* Heatmap comparativo (só para múltiplos pontos com histórico) */}
      {grupo.length > 1 && todosHistorico.length > 0 && (
        <HeatmapLagoa pontos={grupo} historicos={historicosPorPonto} />
      )}

      {/* Links */}
      <div className="flex gap-3 flex-wrap pb-2">
        <a
          href={`/municipio/${p0.municipio_slug}`}
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg"
        >
          🏙️ Ver todas as praias de {p0.municipio}
        </a>
        <a
          href="/mapa"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg"
        >
          🗺️ Ver no mapa
        </a>
      </div>
    </div>
  );
}
