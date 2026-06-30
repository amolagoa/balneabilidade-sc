"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import type { Resumo } from "@/lib/types";

interface Props {
  resumos: Resumo[];
}

const CORES_TEMPORADA: Record<string, string> = {
  "2022-2023": "#94a3b8",
  "2023-2024": "#f59e0b",
  "2024-2025": "#3b82f6",
  "2025-2026": "#0f766e",
};

function buildChartData(resumos: Resumo[]) {
  // Agrupa por temporada e numera os relatórios sequencialmente
  const porTemporada: Record<string, Resumo[]> = {};
  for (const r of resumos) {
    if (!porTemporada[r.temporada]) porTemporada[r.temporada] = [];
    porTemporada[r.temporada].push(r);
  }

  // Encontra o maior número de relatórios em qualquer temporada
  const maxRelatorios = Math.max(...Object.values(porTemporada).map((v) => v.length));

  // Monta um array por "semana relativa"
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < maxRelatorios; i++) {
    const row: Record<string, unknown> = { semana: i + 1 };
    for (const [temporada, rels] of Object.entries(porTemporada)) {
      const sorted = [...rels].sort((a, b) => a.data.localeCompare(b.data));
      if (sorted[i]) {
        row[temporada] = sorted[i].pct_proprias;
        row[`${temporada}_data`] = sorted[i].data;
      }
    }
    rows.push(row);
  }
  return { rows, temporadas: Object.keys(porTemporada).sort() };
}

export function GraficoTemporadas({ resumos }: Props) {
  const { rows, temporadas } = buildChartData(resumos);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 mb-1">Evolução por Temporada</h2>
      <p className="text-xs text-gray-500 mb-4">% de pontos próprios para banho em cada relatório</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="semana"
            tick={{ fontSize: 11 }}
            label={{ value: "Relatório nº", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine
            y={80}
            stroke="#16a34a"
            strokeDasharray="5 5"
            label={{ value: "80%", fontSize: 10, fill: "#16a34a", position: "right" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => value}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              const data = props.payload[`${name}_data`] as string | undefined;
              const dateStr = data
                ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })
                : "";
              return [`${value?.toFixed(1)}%${dateStr ? ` (${dateStr})` : ""}`, name];
            }}
            labelFormatter={(label) => `Relatório ${label}`}
          />
          {temporadas.map((t) => (
            <Line
              key={t}
              type="monotone"
              dataKey={t}
              name={t}
              stroke={CORES_TEMPORADA[t] ?? "#6b7280"}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
