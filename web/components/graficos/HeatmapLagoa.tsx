"use client";
import type { Ponto, Medicao } from "@/lib/types";

interface Props {
  pontos: Ponto[];
  historicos: Medicao[][];
}

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMes(mes: string): string {
  const [y, m] = mes.split("-");
  return `${MESES_ABREV[parseInt(m) - 1]}/${y.slice(2)}`;
}

function statusDoMes(historico: Medicao[], mes: string): "propria" | "impropria" | null {
  const items = historico.filter((m) => m.data.startsWith(mes));
  if (items.length === 0) return null;
  const proprias = items.filter((m) => m.status === "propria").length;
  return proprias / items.length >= 0.5 ? "propria" : "impropria";
}

export function HeatmapLagoa({ pontos, historicos }: Props) {
  // Coleta todos os meses presentes em qualquer histórico
  const todosMeses = new Set<string>();
  historicos.forEach((h) => h.forEach((m) => todosMeses.add(m.data.slice(0, 7))));
  const meses = Array.from(todosMeses).sort().reverse().slice(0, 30);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
      <h2 className="font-semibold text-gray-800 mb-1">Histórico Comparativo por Ponto</h2>
      <p className="text-xs text-gray-500 mb-4">
        Status mensal de cada ponto · verde = própria, vermelho = imprópria
      </p>
      <table className="text-xs border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left text-gray-500 font-medium pr-4 py-1 sticky left-0 bg-white z-10">
              Mês
            </th>
            {pontos.map((p) => (
              <th key={p.id} className="text-center font-medium px-1 py-1 min-w-[44px]">
                <a
                  href={`/praia/${p.id}`}
                  className="text-teal-700 hover:underline whitespace-nowrap"
                >
                  P.{p.ponto_num}
                </a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meses.map((mes) => (
            <tr key={mes}>
              <td className="text-gray-600 font-medium pr-4 py-0.5 sticky left-0 bg-white z-10 whitespace-nowrap">
                {formatMes(mes)}
              </td>
              {pontos.map((p, i) => {
                const status = statusDoMes(historicos[i] ?? [], mes);
                const cls =
                  status === "propria" ? "bg-green-200 text-green-800" :
                  status === "impropria" ? "bg-red-300 text-red-900 font-bold" :
                  "bg-gray-100 text-gray-400";
                const icon =
                  status === "propria" ? "✓" :
                  status === "impropria" ? "✗" : "—";
                return (
                  <td key={p.id} className="py-0.5 px-0.5 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-5 rounded text-xs ${cls}`}>
                      {icon}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-5 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-green-200" />Própria
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-red-300" />Imprópria
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-gray-100" />Sem coleta
        </span>
      </div>
    </div>
  );
}
