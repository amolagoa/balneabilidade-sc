import { getPontos, getPontoHistorico, formatDate } from "@/lib/data";
import { praiaPageSlug } from "@/lib/utils";
import { SemaforoPraia } from "@/components/ui/SemaforoPraia";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MiniHistorico } from "@/components/graficos/MiniHistorico";
import { GraficoHistoricoPonto } from "@/components/graficos/GraficoHistoricoPonto";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateStaticParams() {
  const pontos = await getPontos();
  return pontos.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ponto } = await getPontoHistorico(params.id);
  const statusStr = ponto.ultimo_status === "propria" ? "🟢 Própria para banho" :
    ponto.ultimo_status === "impropria" ? "🔴 Imprópria para banho" : "⚪ Sem dados";
  return {
    title: `${ponto.praia} (Ponto ${ponto.ponto_num}) — ${ponto.municipio} | Balneabilidade SC`,
    description: `${statusStr} · ${ponto.municipio} · Última coleta: ${formatDate(ponto.ultima_coleta ?? "")}`,
    openGraph: {
      title: `${statusStr} — ${ponto.praia}`,
      description: `${ponto.municipio} · ${ponto.descricao}`,
    },
  };
}

export default async function PraiaPage({ params }: Props) {
  const [{ ponto, historico }, todosPontos] = await Promise.all([
    getPontoHistorico(params.id),
    getPontos(),
  ]);

  const ultimasColetas = [...historico].reverse().slice(0, 10);

  // Verifica se há outros pontos da mesma praia
  const irmaosPraia = todosPontos.filter(
    (p) => p.id !== ponto.id && praiaPageSlug(p.municipio_slug, p.praia) === praiaPageSlug(ponto.municipio_slug, ponto.praia)
  );
  const slugPraia = praiaPageSlug(ponto.municipio_slug, ponto.praia);

  // Monta URL do WhatsApp
  const statusStr = ponto.ultimo_status === "propria" ? "✅ PRÓPRIA para banho" : "🚫 IMPRÓPRIA para banho";
  const whatsappMsg = encodeURIComponent(
    `${ponto.praia} (${ponto.municipio}) está ${statusStr}! Confira: https://balneabilidade-sc.vercel.app/praia/${ponto.id}`
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1 flex-wrap">
        <a href="/" className="hover:text-teal-600">Início</a>
        <span>›</span>
        <a href={`/municipio/${ponto.municipio_slug}`} className="hover:text-teal-600">{ponto.municipio}</a>
        <span>›</span>
        <a href={`/balneario/${slugPraia}`} className="hover:text-teal-600">{ponto.praia}</a>
        <span>›</span>
        <span className="text-gray-900 font-medium">Ponto {ponto.ponto_num}</span>
      </nav>

      {/* Banner de outros pontos da mesma praia */}
      {irmaosPraia.length > 0 && (
        <a
          href={`/balneario/${slugPraia}`}
          className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 hover:bg-teal-100 transition-colors"
        >
          <span className="text-teal-600 text-lg">🏖️</span>
          <div className="min-w-0">
            <div className="text-sm font-medium text-teal-800">
              Esta praia tem {irmaosPraia.length + 1} pontos de monitoramento
            </div>
            <div className="text-xs text-teal-600">
              Ver painel completo de {ponto.praia} →
            </div>
          </div>
        </a>
      )}

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{ponto.praia}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ponto {ponto.ponto_num} · {ponto.municipio}
          {ponto.descricao && ` · ${ponto.descricao}`}
        </p>
      </div>

      {/* Semáforo principal */}
      <SemaforoPraia
        status={ponto.ultimo_status}
        ultimaColeta={ponto.ultima_coleta}
        consecutivas={ponto.semanas_proprias_consecutivas}
        pctHistorico={ponto.pct_proprias_historico}
      />

      {/* Compartilhar */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          📱 Compartilhar no WhatsApp
        </a>
        <a
          href={`/mapa`}
          className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 border border-teal-200 text-sm px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors"
        >
          🗺️ Ver no Mapa
        </a>
      </div>

      {/* Histórico visual (bolinhas) */}
      {historico.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">
            Histórico ({historico.length} coletas)
          </h2>
          <MiniHistorico historico={historico} maxItems={30} />
        </div>
      )}

      {/* Gráfico mensal */}
      {historico.length >= 5 && <GraficoHistoricoPonto historico={historico} />}

      {/* Tabela das últimas coletas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Últimas Coletas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-left px-4 py-2">Situação</th>
                {ultimasColetas.some(m => m.nmp) && <th className="text-left px-4 py-2">E. coli (NMP)</th>}
                {ultimasColetas.some(m => m.chuva) && <th className="text-left px-4 py-2">Chuva</th>}
                {ultimasColetas.some(m => m.temp_agua) && <th className="text-left px-4 py-2">Temp. Água</th>}
              </tr>
            </thead>
            <tbody>
              {ultimasColetas.map((m, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{formatDate(m.data)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={m.status} size="sm" />
                  </td>
                  {ultimasColetas.some(x => x.nmp) && (
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">
                      {m.nmp !== null && m.nmp !== undefined ? m.nmp.toLocaleString("pt-BR") : "—"}
                    </td>
                  )}
                  {ultimasColetas.some(x => x.chuva) && (
                    <td className="px-4 py-2 text-gray-600 text-xs">{m.chuva || "—"}</td>
                  )}
                  {ultimasColetas.some(x => x.temp_agua) && (
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {m.temp_agua ? `${m.temp_agua}°C` : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info técnica colapsável */}
      <details className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100">
          ℹ️ Sobre a metodologia de análise
        </summary>
        <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
          <p>As amostras são coletadas pelo Corpo de Bombeiros Militar de SC e analisadas pelo método NMP (Número Mais Provável), usando Colilert-18, conforme Standard Methods 9223B.</p>
          <p><strong>Própria:</strong> ≤ 800 E. coli/100mL em ≥ 80% das últimas 5 amostras coletadas no mesmo ponto.</p>
          <p><strong>Imprópria:</strong> &gt; 800 E. coli/100mL em &gt; 20% das amostras, ou &gt; 2.000 na última coleta.</p>
          <p className="text-xs text-gray-400">Resolução CONAMA nº 274/2000 · Fonte: IMA/SC</p>
        </div>
      </details>
    </div>
  );
}
