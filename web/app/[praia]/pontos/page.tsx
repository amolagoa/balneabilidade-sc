import { notFound } from "next/navigation";
import { getPontos, getPontoHistorico } from "@/lib/data";
import { getPraiaBySlug } from "@/lib/praias";
import { PontosLagoaClient } from "@/components/lagoa/PontosLagoaClient";
import type { Metadata } from "next";

interface Props { params: { praia: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = getPraiaBySlug(params.praia);
  if (!config) return {};
  return { title: `Análise por Ponto — ${config.nome} | Balneabilidade SC` };
}

export default async function PraiaPontosPage({ params }: Props) {
  const config = getPraiaBySlug(params.praia);
  if (!config) notFound();

  const pontos = await getPontos();
  const praiaPoints = config.ids.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;
  const historicos = await Promise.all(
    praiaPoints.map((p) => getPontoHistorico(p.id).catch(() => ({ ponto: p, historico: [] })))
  );
  const dadosPorPonto = praiaPoints.map((p) => ({
    ponto: p,
    historico: historicos.find((h) => h.ponto.id === p.id)?.historico ?? [],
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análise por Ponto</h1>
        <p className="text-gray-500 text-sm mt-1">
          {config.nome} · Florianópolis · {praiaPoints.length} ponto{praiaPoints.length !== 1 ? "s" : ""} monitorado{praiaPoints.length !== 1 ? "s" : ""}
        </p>
      </div>
      <PontosLagoaClient dadosPorPonto={dadosPorPonto} />
    </div>
  );
}
