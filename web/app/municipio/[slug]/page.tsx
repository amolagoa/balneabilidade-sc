import { getMunicipios, getMunicipioData, formatDate } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const municipios = await getMunicipios();
  return municipios.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { municipio } = await getMunicipioData(params.slug);
  const pct = municipio.pct_proprias?.toFixed(0) ?? "—";
  return {
    title: `Balneabilidade ${municipio.nome} — ${pct}% próprias | SC`,
    description: `${municipio.n_proprias} de ${municipio.n_pontos} pontos próprios para banho em ${municipio.nome}. Veja o status atual de cada praia.`,
    openGraph: {
      title: `Praias de ${municipio.nome} — ${pct}% próprias para banho`,
      description: `${municipio.n_proprias} próprias · ${municipio.n_improprias} impróprias · ${municipio.n_pontos} pontos monitorados`,
    },
  };
}

export default async function MunicipioPage({ params }: Props) {
  const { municipio, pontos } = await getMunicipioData(params.slug);

  const pct = municipio.pct_proprias ?? 0;

  const statusOrder: Record<string, number> = { impropria: 0, indeterminado: 1, propria: 2 };
  const sortedPontos = [...pontos].sort((a, b) => {
    const ao = statusOrder[a.ultimo_status ?? "indeterminado"] ?? 1;
    const bo = statusOrder[b.ultimo_status ?? "indeterminado"] ?? 1;
    return ao - bo;
  });

  const barColor = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-400" : "bg-red-500";
  const pctColor = pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <a href="/" className="hover:text-teal-600">Início</a>
        <span>›</span>
        <span className="text-gray-900 font-medium">{municipio.nome}</span>
      </nav>

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{municipio.nome}</h1>
        <p className="text-gray-500 text-sm mt-1">{municipio.n_pontos} pontos monitorados</p>
      </div>

      {/* Status geral */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Status atual das praias</span>
          <span className={`text-2xl font-bold ${pctColor}`}>
            {pct.toFixed(0)}% próprias
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs mt-2">
          <span className="text-green-700 font-medium">✅ {municipio.n_proprias} próprias</span>
          {municipio.n_improprias > 0 && (
            <span className="text-red-700 font-medium">🚫 {municipio.n_improprias} impróprias</span>
          )}
          {municipio.n_sem_dados > 0 && (
            <span className="text-gray-500">⚪ {municipio.n_sem_dados} sem dados</span>
          )}
        </div>
      </div>

      {/* Grid de pontos */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">
          Pontos de monitoramento
          {municipio.n_improprias > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              (impróprias listadas primeiro)
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedPontos.map((p) => (
            <a
              key={p.id}
              href={`/praia/${p.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm leading-tight">{p.praia}</div>
                  {p.ponto_num && (
                    <div className="text-xs text-gray-500 mt-0.5">Ponto {p.ponto_num}</div>
                  )}
                  {p.descricao && (
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descricao}</div>
                  )}
                </div>
                <div className="shrink-0">
                  <StatusBadge status={p.ultimo_status} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {p.ultima_coleta && (
                  <span>Coleta: {formatDate(p.ultima_coleta)}</span>
                )}
                {p.pct_proprias_historico !== null && (
                  <span>{p.pct_proprias_historico}% hist.</span>
                )}
                {p.semanas_proprias_consecutivas > 1 && p.ultimo_status === "propria" && (
                  <span className="text-green-600">{p.semanas_proprias_consecutivas} sem. seguidas ✓</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3 pb-2">
        <a
          href="/mapa"
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg"
        >
          🗺️ Ver no mapa
        </a>
        <a
          href="/temporadas"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg"
        >
          📈 Evolução histórica de SC
        </a>
      </div>
    </div>
  );
}
