"use client";
import type { Status } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Props {
  status: Status | null;
  ultimaColeta: string | null;
  consecutivas?: number;
  pctHistorico?: number | null;
}

const msgs = {
  propria: {
    titulo: "✅ Pode nadar aqui",
    subtitulo: "Esta praia está própria para banho",
    cor: "bg-green-50 border-green-300 text-green-900",
    borda: "border-l-4 border-l-green-500",
  },
  impropria: {
    titulo: "🚫 Evite o banho",
    subtitulo: "Esta praia está imprópria para banho",
    cor: "bg-red-50 border-red-300 text-red-900",
    borda: "border-l-4 border-l-red-500",
  },
  indeterminado: {
    titulo: "⚪ Sem dados recentes",
    subtitulo: "Aguardando resultado da coleta",
    cor: "bg-gray-50 border-gray-300 text-gray-700",
    borda: "border-l-4 border-l-gray-400",
  },
};

export function SemaforoPraia({ status, ultimaColeta, consecutivas, pctHistorico }: Props) {
  const m = msgs[status ?? "indeterminado"];
  return (
    <div className={`rounded-xl border p-5 ${m.cor} ${m.borda}`}>
      <div className="text-2xl font-bold mb-1">{m.titulo}</div>
      <div className="text-sm opacity-80">{m.subtitulo}</div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {ultimaColeta && (
          <span className="opacity-70">
            Última coleta: <strong>{formatDate(ultimaColeta)}</strong>
          </span>
        )}
        {status === "propria" && consecutivas && consecutivas > 1 && (
          <span className="font-medium text-green-700">
            🏅 Própria há {consecutivas} coletas consecutivas
          </span>
        )}
        {pctHistorico !== null && pctHistorico !== undefined && (
          <span className="opacity-70">
            Histórico: <strong>{pctHistorico}%</strong> das coletas foram próprias
          </span>
        )}
      </div>
    </div>
  );
}
