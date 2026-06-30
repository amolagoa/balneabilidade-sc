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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={fechar}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 px-6 pt-6 pb-5 flex items-center gap-4 rounded-t-3xl sm:rounded-t-3xl shrink-0">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-md shrink-0">
            <Image
              src="/AMOLAGOA.png"
              alt="AMOLAGOA"
              width={120}
              height={40}
              className="h-9 w-auto"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-base font-bold leading-snug">Painel de Balneabilidade</h2>
            <p className="text-teal-100 text-xs mt-0.5">Lagoa da Conceição · Florianópolis</p>
          </div>
          <button
            onClick={fechar}
            className="shrink-0 text-white/70 hover:text-white transition-colors p-1"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo — com scroll */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">📅</span>
              <div>
                <div className="font-semibold text-slate-800 text-xs mb-0.5">Período de coleta</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Durante a temporada de verão (novembro a março), as análises são realizadas <strong className="text-slate-700">semanalmente</strong> em 9 pontos ao longo da Lagoa. Após o encerramento da temporada, são realizadas mais duas coletas: uma no <strong className="text-slate-700">final de abril</strong> e outra no <strong className="text-slate-700">final de maio</strong>, encerrando o monitoramento até novembro.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">🗓️</span>
              <div>
                <div className="font-semibold text-slate-800 text-xs mb-0.5">Organização por temporada</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Os dados são agrupados por temporada de verão (ex: 2024/2025), permitindo comparar a evolução da qualidade da água ao longo dos anos.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <span className="text-lg shrink-0">🧪</span>
              <div>
                <div className="font-semibold text-slate-800 text-xs mb-0.5">Critério de classificação</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Segue a Resolução CONAMA 274/2000, baseada na contagem de <em>E. coli</em> (NMP/100mL). Valores acima do limite tornam o ponto impróprio para banho.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé — sempre visível */}
        <div className="px-5 pt-2 pb-6 shrink-0">
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
