"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export function BemVindo() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const visto = sessionStorage.getItem("bemvindo_visto");
    if (!visto) setAberto(true);
  }, []);

  function fechar() {
    sessionStorage.setItem("bemvindo_visto", "1");
    setAberto(false);
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 px-8 pt-8 pb-6 flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl px-4 py-2 shadow-md">
            <Image
              src="/AMOLAGOA.png"
              alt="AMOLAGOA"
              width={160}
              height={52}
              className="h-11 w-auto"
            />
          </div>
          <h2 className="text-white text-lg font-bold text-center leading-snug">
            Painel de Balneabilidade<br />
            <span className="font-normal text-teal-100 text-sm">Lagoa da Conceição · Florianópolis</span>
          </h2>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Este painel é uma iniciativa da{" "}
            <a
              href="https://amolagoa.floripa.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-700 hover:underline"
            >
              Associação dos Moradores da Lagoa da Conceição — AMOLAGOA
            </a>
            , para facilitar o acesso e o entendimento da comunidade sobre os resultados das análises de balneabilidade realizadas periodicamente pelo{" "}
            <strong className="text-gray-800">Instituto do Meio Ambiente — IMA-SC</strong>.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden text-sm">
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">📅</span>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Período de coleta</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Durante a temporada de verão (novembro a março), as análises são realizadas <strong className="text-slate-700">semanalmente</strong> pelo IMA-SC em 9 pontos ao longo da Lagoa. Após o encerramento da temporada, são realizadas mais duas coletas: uma no <strong className="text-slate-700">final de abril</strong> e outra no <strong className="text-slate-700">final de maio</strong>, encerrando o monitoramento até novembro.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">🗓️</span>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Organização por temporada</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Os dados são agrupados por temporada de verão (ex: 2024/2025), permitindo comparar a evolução da qualidade da água ao longo dos anos.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">🧪</span>
              <div>
                <div className="font-semibold text-slate-800 mb-0.5">Critério de classificação</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Segue a Resolução CONAMA 274/2000, baseada na contagem de <em>E. coli</em> (NMP/100mL). Valores acima do limite tornam o ponto impróprio para banho.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 pb-6">
          <button
            onClick={fechar}
            className="w-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Entendi — acessar o painel
          </button>
        </div>

      </div>
    </div>
  );
}
