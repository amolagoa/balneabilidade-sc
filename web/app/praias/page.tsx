import { getPontos, getMunicipios } from "@/lib/data";
import { PainelPraias } from "@/components/praias/PainelPraias";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar Praias | Balneabilidade SC",
  description: "Filtre e explore todas as praias de Santa Catarina com painel detalhado de histórico.",
};

export default async function PraiasPage() {
  const [pontos, municipios] = await Promise.all([getPontos(), getMunicipios()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Explorar Praias</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pontos.length} pontos monitorados · filtre e clique numa praia para ver o painel detalhado
        </p>
      </div>
      <PainelPraias pontos={pontos} municipios={municipios} />
    </div>
  );
}
