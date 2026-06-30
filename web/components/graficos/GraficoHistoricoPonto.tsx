"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import type { Medicao } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Props {
  historico: Medicao[];
}

// Agrupa por temporada e calcula % próprias por mês
function buildChartData(historico: Medicao[]) {
  const grouped: Record<string, { proprias: number; total: number }> = {};
  for (const m of historico) {
    const [y, mo] = m.data.split("-");
    const key = `${y}-${mo}`;
    if (!grouped[key]) grouped[key] = { proprias: 0, total: 0 };
    grouped[key].total++;
    if (m.status === "propria") grouped[key].proprias++;
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, { proprias, total }]) => ({
      mes,
      label: mes.slice(0, 7),
      pct: Math.round((proprias / total) * 100),
      proprias,
      total,
    }));
}

export function GraficoHistoricoPonto({ historico }: Props) {
  const data = buildChartData(historico);
  if (data.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-4">Evolução Mensal (%  Próprias)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const [y, m] = v.split("-");
              const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
              return `${meses[parseInt(m) - 1]}/${y.slice(2)}`;
            }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="5 5" label={{ value: "80%", fontSize: 10, fill: "#16a34a" }} />
          <Tooltip
            formatter={(value: number, _: string, props: any) => [
              `${value}% próprias (${props.payload.proprias}/${props.payload.total})`,
              "Situação",
            ]}
            labelFormatter={(label) => {
              const [y, m] = label.split("-");
              const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
              return `${meses[parseInt(m) - 1]} de ${y}`;
            }}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#0f766e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#0f766e" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
