import { getPontos } from "@/lib/data";
import { MapaPontos } from "@/components/mapa/MapaPontos";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa — Lagoa da Conceição | Balneabilidade SC",
  description:
    "Mapa interativo com os 9 pontos de monitoramento de balneabilidade da Lagoa da Conceição em Florianópolis.",
};

const LAGOA_IDS = [
  "ima_257", "ima_258", "ima_259", "ima_260", "ima_261",
  "ima_262", "ima_337", "ima_390", "ima_391",
];

const LAGOA_CENTER: [number, number] = [-27.612, -48.462];

export default async function MapaLagoaPage() {
  const pontos = await getPontos();
  const lagoaPontos = LAGOA_IDS.map((id) => pontos.find((p) => p.id === id)).filter(Boolean) as typeof pontos;

  const nProprias = lagoaPontos.filter((p) => p.ultimo_status === "propria").length;
  const nImproprias = lagoaPontos.filter((p) => p.ultimo_status === "impropria").length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lagoa da Conceição · {lagoaPontos.length} pontos monitorados
          </p>
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">🟢 {nProprias} próprias</span>
          {nImproprias > 0 && (
            <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full">🔴 {nImproprias} impróprias</span>
          )}
        </div>
      </div>

      <div style={{ height: "calc(100vh - 260px)", minHeight: "420px" }}>
        <MapaPontos pontos={lagoaPontos} center={LAGOA_CENTER} zoom={13} />
      </div>

      {/* Lista de pontos abaixo do mapa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {lagoaPontos.map((p) => (
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
