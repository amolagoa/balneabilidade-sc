import { notFound } from "next/navigation";
import { getPontos } from "@/lib/data";
import { getPraiaBySlug } from "@/lib/praias";
import { MapaPontos } from "@/components/mapa/MapaPontos";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Metadata } from "next";

interface Props { params: { praia: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = getPraiaBySlug(params.praia);
  if (!config) return {};
  return { title: `Mapa — ${config.nome} | Balneabilidade SC` };
}

export default async function PraiaMapaPage({ params }: Props) {
  const config = getPraiaBySlug(params.praia);
  if (!config) notFound();

  const pontos = await getPontos();
  const praiaPoints = config.ids.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;

  const nProprias = praiaPoints.filter((p) => p.ultimo_status === "propria").length;
  const nImproprias = praiaPoints.filter((p) => p.ultimo_status === "impropria").length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa</h1>
          <p className="text-gray-500 text-sm mt-1">
            {config.nome} · {praiaPoints.length} ponto{praiaPoints.length !== 1 ? "s" : ""} monitorado{praiaPoints.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">🟢 {nProprias} própria{nProprias !== 1 ? "s" : ""}</span>
          {nImproprias > 0 && (
            <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full">🔴 {nImproprias} imprópria{nImproprias !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div style={{ height: "calc(100vh - 260px)", minHeight: "420px" }}>
        <MapaPontos pontos={praiaPoints} center={config.center} zoom={config.zoom} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {praiaPoints.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <StatusBadge status={p.ultimo_status} size="sm" />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 text-sm">Ponto {p.ponto_num}</div>
              <div className="text-xs text-gray-500 truncate">{p.descricao}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
