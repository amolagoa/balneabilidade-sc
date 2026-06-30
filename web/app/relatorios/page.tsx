import { getResumos, getMeta, formatDate } from "@/lib/data";
import { PainelRelatorios } from "@/components/relatorios/PainelRelatorios";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Relatórios de Balneabilidade | SC",
  description: "Consulte todos os relatórios de balneabilidade das praias de Santa Catarina, do mais recente ao mais antigo.",
};

export default async function RelatoriosPage() {
  const resumos = await getResumos();
  const meta = await getMeta();

  const sorted = [...resumos].sort((a, b) => b.data.localeCompare(a.data));
  const ultimo = sorted[0];
  const proprias = ultimo.floripa_proprias + ultimo.interior_proprias;
  const improprias = ultimo.floripa_improprias + ultimo.interior_improprias;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios de Balneabilidade</h1>
        <p className="text-gray-500 text-sm mt-1">
          {resumos.length} relatórios disponíveis · 4 temporadas ·
          último em {formatDate(ultimo.data)} ·
          {proprias} próprias / {improprias} impróprias
        </p>
      </div>

      <PainelRelatorios resumos={resumos} />
    </div>
  );
}
