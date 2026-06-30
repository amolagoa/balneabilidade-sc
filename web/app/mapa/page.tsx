import { getPontos, getMunicipios, getMeta, formatDate } from "@/lib/data";
import { MapaBalneabilidade } from "@/components/mapa/MapaBalneabilidade";

export const metadata = {
  title: "Mapa de Balneabilidade SC",
  description: "Mapa interativo com o status de balneabilidade de todas as praias de Santa Catarina.",
};

export default async function MapaPage() {
  const [pontos, municipios, meta] = await Promise.all([getPontos(), getMunicipios(), getMeta()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Balneabilidade</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total_pontos} pontos · Atualizado em {formatDate(meta.ultima_atualizacao)}
          </p>
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">🟢 {meta.total_proprias}</span>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">🔴 {meta.total_improprias}</span>
        </div>
      </div>

      <div style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <MapaBalneabilidade pontos={pontos} municipios={municipios} />
      </div>
    </div>
  );
}
