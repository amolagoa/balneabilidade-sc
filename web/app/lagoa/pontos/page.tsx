import { getPontos, getPontoHistorico } from "@/lib/data";
import { PontosLagoaClient } from "@/components/lagoa/PontosLagoaClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análise por Ponto — Lagoa da Conceição | Florianópolis SC",
  description:
    "Histórico detalhado de cada ponto de monitoramento da Lagoa da Conceição. Compare o desempenho dos 9 pontos do IMA/SC.",
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

export default async function PontosPage() {
  const pontos = await getPontos();
  const lagoaPontos = LAGOA_IDS.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;

  const historicos = await Promise.all(
    lagoaPontos.map((p) => getPontoHistorico(p.id).catch(() => ({ ponto: p, historico: [] })))
  );

  const dadosPorPonto = lagoaPontos.map((p) => ({
    ponto: p,
    historico: historicos.find((h) => h.ponto.id === p.id)?.historico ?? [],
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análise por Ponto</h1>
        <p className="text-gray-500 text-sm mt-1">
          Lagoa da Conceição · {lagoaPontos.length} pontos monitorados · histórico completo desde 2023
        </p>
      </div>

      <PontosLagoaClient dadosPorPonto={dadosPorPonto} />
    </div>
  );
}
