import { getPontos, getPontoHistorico } from "@/lib/data";
import { AnaliseTemporadaClient } from "@/components/lagoa/AnaliseTemporadaClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análise por Temporada — Lagoa da Conceição | Balneabilidade SC",
  description:
    "Análise detalhada do histórico de balneabilidade da Lagoa da Conceição: timeline semanal, heatmap de pontos, comparação entre temporadas e ranking.",
};

const LAGOA_IDS = [
  "ima_257", // P.37 — Servidão Pedro Manuel Fernandes
  "ima_258", // P.38 — Trapiches dos Serviços de Transportes
  "ima_259", // P.39 — acesso à Praia da Joaquina
  "ima_260", // P.41 — Canto da Lagoa
  "ima_261", // P.43 — acesso ao Rio Tavares
  "ima_262", // P.61 — Av. das Rendeiras
  "ima_337", // P.72 — Rua Canto da Amizade
  "ima_390", // P.96 — Rua Orlando Carioni
  "ima_391", // P.97 — Rua Vereador Osni Ortiga
];

export default async function LagoaAnalisePage() {
  const pontos = await getPontos();
  const lagoaPontos = LAGOA_IDS.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;

  const historicos = await Promise.all(
    lagoaPontos.map((p) =>
      getPontoHistorico(p.id).catch(() => ({ ponto: p, historico: [] }))
    )
  );

  const dadosPorPonto = lagoaPontos.map((p) => ({
    ponto: p,
    historico: historicos.find((h) => h.ponto.id === p.id)?.historico ?? [],
  }));

  return (
    <div className="space-y-5">
      <nav className="text-sm text-gray-500 flex items-center gap-1 flex-wrap">
        <a href="/" className="hover:text-teal-600">Início</a>
        <span>›</span>
        <a href="/municipio/florianopolis" className="hover:text-teal-600">Florianópolis</a>
        <span>›</span>
        <a href="/lagoa" className="hover:text-teal-600">Lagoa da Conceição</a>
        <span>›</span>
        <span className="text-gray-900 font-medium">Análise por Temporada</span>
      </nav>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise por Temporada</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lagoa da Conceição · Florianópolis · {lagoaPontos.length} pontos monitorados
          </p>
        </div>
        <a
          href="/lagoa"
          className="text-sm text-teal-600 hover:text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg whitespace-nowrap"
        >
          ← Status atual
        </a>
      </div>

      <AnaliseTemporadaClient dadosPorPonto={dadosPorPonto} />
    </div>
  );
}
