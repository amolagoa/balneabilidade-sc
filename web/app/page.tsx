import { getMeta, getMunicipios, getPontos, formatDate } from "@/lib/data";
import { CardMunicipio } from "@/components/ui/CardMunicipio";
import { BuscaPraia } from "@/components/ui/BuscaPraia";

export default async function HomePage() {
  const [meta, municipios, pontos] = await Promise.all([getMeta(), getMunicipios(), getPontos()]);

  const pct = Math.round((meta.total_proprias / meta.total_pontos) * 100);
  const corBarra = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-400" : "bg-red-500";

  const munOrdenados = [...municipios].sort((a, b) => {
    const pctA = a.n_proprias + a.n_improprias > 0 ? a.n_proprias / (a.n_proprias + a.n_improprias) : 1;
    const pctB = b.n_proprias + b.n_improprias > 0 ? b.n_proprias / (b.n_proprias + b.n_improprias) : 1;
    return pctA - pctB; // Piores primeiro
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Praias de Santa Catarina
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Atualizado em {formatDate(meta.ultima_atualizacao)} · {meta.total_pontos} pontos monitorados
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/mapa"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              🗺️ Ver no Mapa
            </a>
          </div>
        </div>

        {/* Números grandes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-700">{meta.total_proprias}</div>
            <div className="text-sm text-green-800 font-medium mt-1">🟢 Próprias</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
            <div className="text-3xl font-bold text-red-700">{meta.total_improprias}</div>
            <div className="text-sm text-red-800 font-medium mt-1">🔴 Impróprias</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-700">{pct}%</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Próprias para banho</div>
          </div>
        </div>

        {/* Barra geral */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{meta.total_proprias} próprias</span>
            <span>{meta.total_improprias} impróprias</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`h-3 rounded-full transition-all ${corBarra}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Busca */}
        <div className="pt-2">
          <p className="text-sm text-gray-600 mb-2 text-center">Encontre sua praia:</p>
          <BuscaPraia pontos={pontos} />
        </div>
      </section>

      {/* Grid municípios */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Por Município</h2>
          <a href="/temporadas" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            Ver evolução histórica →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {munOrdenados.map((m) => (
            <CardMunicipio key={m.slug} municipio={m} />
          ))}
        </div>
      </section>

      {/* Info rápida para leigos */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Como funciona?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• O IMA/SC coleta amostras de água semanalmente em {meta.total_pontos} pontos da costa</li>
          <li>• <strong>Própria:</strong> menos de 800 E. coli por 100mL em 80% das últimas 5 amostras</li>
          <li>• <strong>Imprópria:</strong> acima desse limite — risco de infecção ao nadar</li>
          <li>• Dados baseados na Resolução CONAMA 274/2000</li>
        </ul>
      </section>
    </div>
  );
}
