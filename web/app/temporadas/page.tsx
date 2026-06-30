import { getResumos } from "@/lib/data";
import { GraficoTemporadas } from "@/components/graficos/GraficoTemporadas";
import { HeatmapMensal } from "@/components/graficos/HeatmapMensal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolução por Temporada | Balneabilidade SC",
  description: "Análise histórica da qualidade das praias de Santa Catarina por temporada. Veja como a balneabilidade evoluiu de 2022 até hoje.",
};

function formatDateBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function TemporadasPage() {
  const resumos = await getResumos();

  const comDados = resumos.filter((r) => r.pct_proprias !== null);
  const melhor = comDados.reduce((a, b) => (a.pct_proprias! > b.pct_proprias! ? a : b));
  const pior = comDados.reduce((a, b) => (a.pct_proprias! < b.pct_proprias! ? a : b));

  const temporadas = Array.from(new Set(resumos.map((r) => r.temporada))).sort();

  // Pct médio por temporada
  const mediaPorTemporada = temporadas.map((t) => {
    const rels = comDados.filter((r) => r.temporada === t);
    const avg = rels.reduce((s, r) => s + r.pct_proprias!, 0) / rels.length;
    return { temporada: t, avg: avg.toFixed(1) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evolução por Temporada</h1>
        <p className="text-gray-500 text-sm mt-1">
          {temporadas.length} temporadas · {resumos.length} relatórios · dados desde {formatDateBR(resumos[0]?.data ?? "")}
        </p>
      </div>

      {/* Cards de destaque */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-xs text-green-700 font-medium uppercase tracking-wide">Melhor resultado</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{melhor.pct_proprias?.toFixed(0)}%</div>
          <div className="text-xs text-green-600 mt-0.5">
            {formatDateBR(melhor.data)} · Rel. {melhor.relatorio}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs text-red-700 font-medium uppercase tracking-wide">Pior resultado</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{pior.pct_proprias?.toFixed(0)}%</div>
          <div className="text-xs text-red-600 mt-0.5">
            {formatDateBR(pior.data)} · Rel. {pior.relatorio}
          </div>
        </div>
      </div>

      {/* Média por temporada */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Média por temporada</h2>
        <div className="space-y-2">
          {mediaPorTemporada.map(({ temporada, avg }) => {
            const v = parseFloat(avg);
            const barColor = v >= 80 ? "bg-green-500" : v >= 60 ? "bg-yellow-400" : "bg-red-500";
            const textColor = v >= 80 ? "text-green-700" : v >= 60 ? "text-yellow-700" : "text-red-700";
            return (
              <div key={temporada} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 shrink-0">{temporada}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${v}%` }} />
                </div>
                <span className={`text-sm font-semibold w-12 text-right ${textColor}`}>{avg}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico de linhas */}
      <GraficoTemporadas resumos={resumos} />

      {/* Heatmap mensal */}
      <HeatmapMensal resumos={resumos} />

      {/* Nota metodológica */}
      <div className="text-xs text-gray-400 text-center pb-2">
        Dados dos relatórios semanais/mensais do IMA/SC · CONAMA 274/2000 · Os percentuais refletem apenas os pontos com coleta naquele relatório
      </div>
    </div>
  );
}
