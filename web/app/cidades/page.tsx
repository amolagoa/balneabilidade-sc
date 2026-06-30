import { getMunicipios, getMeta, formatDate } from "@/lib/data";
import { CardMunicipio } from "@/components/ui/CardMunicipio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Balneabilidade por Cidade | SC",
  description: "Veja o status de balneabilidade de todas as cidades do litoral de Santa Catarina.",
};

export default async function CidadesPage() {
  const [municipios, meta] = await Promise.all([getMunicipios(), getMeta()]);

  const munOrdenados = [...municipios].sort((a, b) => {
    const pctA = a.n_proprias + a.n_improprias > 0 ? a.n_proprias / (a.n_proprias + a.n_improprias) : 1;
    const pctB = b.n_proprias + b.n_improprias > 0 ? b.n_proprias / (b.n_proprias + b.n_improprias) : 1;
    return pctA - pctB;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cidades</h1>
        <p className="text-gray-500 text-sm mt-1">
          {meta.total_municipios} municípios monitorados · {meta.total_pontos} pontos ·
          atualizado em {formatDate(meta.ultima_atualizacao)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {munOrdenados.map((m) => (
          <CardMunicipio key={m.slug} municipio={m} />
        ))}
      </div>
    </div>
  );
}
