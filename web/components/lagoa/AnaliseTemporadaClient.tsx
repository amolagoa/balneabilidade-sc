"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { Ponto, Medicao } from "@/lib/types";

interface PontoDados {
  ponto: Ponto;
  historico: Medicao[];
}

interface Props {
  dadosPorPonto: PontoDados[];
}

const MESES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

const MESES_FULL: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

const SEASON_COLORS: Record<string, string> = {
  "2022-2023": "#94a3b8",
  "2023-2024": "#60a5fa",
  "2024-2025": "#34d399",
  "2025-2026": "#0f766e",
};

function seasonColor(t: string): string {
  return SEASON_COLORS[t] ?? "#64748b";
}

function fmtData(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fmtMesAno(anoMes: string): string {
  const [y, m] = anoMes.split("-");
  return `${MESES[m]}/${y.slice(2)}`;
}

function nomeMesCompleto(anoMes: string): string {
  const [y, m] = anoMes.split("-");
  return `${MESES_FULL[m]}/${y}`;
}

function barColor(pct: number): string {
  if (pct >= 67) return "#16a34a";
  if (pct >= 34) return "#d97706";
  return "#dc2626";
}

// ---------- helpers de dados ----------

function getTemporadas(dados: PontoDados[]): string[] {
  const set = new Set<string>();
  dados.forEach((d) => d.historico.forEach((m) => { if (m.temporada) set.add(m.temporada); }));
  return Array.from(set).sort();
}

function filtrarTemporada(historico: Medicao[], temporada: string): Medicao[] {
  return historico.filter((m) => m.temporada === temporada);
}

function getTimelineData(dados: PontoDados[], temporada: string) {
  const map = new Map<string, { p: number; i: number }>();
  dados.forEach((d) =>
    filtrarTemporada(d.historico, temporada).forEach((m) => {
      const e = map.get(m.data) ?? { p: 0, i: 0 };
      if (m.status === "propria") e.p++; else e.i++;
      map.set(m.data, e);
    })
  );
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, s]) => {
      const total = s.p + s.i;
      return { data, dataFmt: fmtData(data), proprias: s.p, improprias: s.i, total, pct: total > 0 ? Math.round((s.p / total) * 100) : 0 };
    });
}

function getMonthlyData(dados: PontoDados[], temporada: string) {
  const map = new Map<string, { p: number; i: number }>();
  dados.forEach((d) =>
    filtrarTemporada(d.historico, temporada).forEach((m) => {
      const mes = m.data.slice(0, 7);
      const e = map.get(mes) ?? { p: 0, i: 0 };
      if (m.status === "propria") e.p++; else e.i++;
      map.set(mes, e);
    })
  );
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, s]) => {
      const total = s.p + s.i;
      return { mes, mesFmt: fmtMesAno(mes), proprias: s.p, improprias: s.i, total, pct: total > 0 ? Math.round((s.p / total) * 100) : 0 };
    });
}

function getPontoStats(dados: PontoDados[], temporada: string) {
  return dados
    .map((d) => {
      const filtrado = filtrarTemporada(d.historico, temporada);
      const proprias = filtrado.filter((m) => m.status === "propria").length;
      const improprias = filtrado.filter((m) => m.status === "impropria").length;
      const total = filtrado.length;
      return { ponto: d.ponto, proprias, improprias, total, pct: total > 0 ? Math.round((proprias / total) * 100) : null };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
}

function getHeatmapData(dados: PontoDados[], temporada: string) {
  const datesSet = new Set<string>();
  dados.forEach((d) => filtrarTemporada(d.historico, temporada).forEach((m) => datesSet.add(m.data)));
  const dates = Array.from(datesSet).sort();
  const rows = dados
    .map((d) => {
      const filtrado = filtrarTemporada(d.historico, temporada);
      const byDate = new Map(filtrado.map((m) => [m.data, m.status] as [string, string]));
      return { ponto: d.ponto, byDate };
    })
    .filter((r) => r.byDate.size > 0);
  return { dates, rows };
}

function getComparacaoData(dados: PontoDados[], temporadas: string[]) {
  const series = temporadas.map((t) => ({ temporada: t, timeline: getTimelineData(dados, t) }));
  const maxLen = Math.max(...series.map((s) => s.timeline.length), 0);
  return Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, number | string> = { semana: i + 1 };
    series.forEach((s) => { if (i < s.timeline.length) row[s.temporada] = s.timeline[i].pct; });
    return row;
  });
}

// ---------- tooltips ----------

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <div className="font-semibold text-gray-900 mb-1.5">{d.data}</div>
      <div className="space-y-0.5">
        <div className="text-green-700">🟢 {d.proprias} próprios</div>
        <div className="text-red-600">🔴 {d.improprias} impróprios</div>
      </div>
      <div className="font-bold text-gray-800 mt-1.5 pt-1.5 border-t border-gray-100">{d.pct}% próprias</div>
    </div>
  );
}

function MonthlyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <div className="font-semibold text-gray-900 mb-1.5">{nomeMesCompleto(d.mes)}</div>
      <div className="text-gray-500 text-xs mb-1">{d.total} medições no mês</div>
      <div className="space-y-0.5">
        <div className="text-green-700">🟢 {d.proprias} próprias</div>
        <div className="text-red-600">🔴 {d.improprias} impróprias</div>
      </div>
      <div className="font-bold text-gray-800 mt-1.5 pt-1.5 border-t border-gray-100">{d.pct}% próprias</div>
    </div>
  );
}

function ComparacaoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[170px]">
      <div className="font-semibold text-gray-900 mb-2">Semana {label}</div>
      {sorted.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600 text-xs">{p.dataKey}</span>
          </div>
          <span className="font-medium text-gray-900 text-xs">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ---------- componente principal ----------

export function AnaliseTemporadaClient({ dadosPorPonto }: Props) {
  const temporadas = useMemo(() => getTemporadas(dadosPorPonto), [dadosPorPonto]);
  const [temporada, setTemporada] = useState(() => temporadas.at(-1) ?? "2025-2026");

  const timeline = useMemo(() => getTimelineData(dadosPorPonto, temporada), [dadosPorPonto, temporada]);
  const monthly = useMemo(() => getMonthlyData(dadosPorPonto, temporada), [dadosPorPonto, temporada]);
  const pontoStats = useMemo(() => getPontoStats(dadosPorPonto, temporada), [dadosPorPonto, temporada]);
  const heatmap = useMemo(() => getHeatmapData(dadosPorPonto, temporada), [dadosPorPonto, temporada]);
  const comparacao = useMemo(() => getComparacaoData(dadosPorPonto, temporadas), [dadosPorPonto, temporadas]);

  const totalMedicoes = timeline.reduce((s, d) => s + d.total, 0);
  const totalProprias = timeline.reduce((s, d) => s + d.proprias, 0);
  const pctGeral = totalMedicoes > 0 ? Math.round((totalProprias / totalMedicoes) * 100) : 0;
  const pontosAtivos = dadosPorPonto.filter((d) => filtrarTemporada(d.historico, temporada).length > 0).length;

  const melhorMes = monthly.length > 0 ? [...monthly].sort((a, b) => b.pct - a.pct)[0] : null;
  const piorMes = monthly.length > 0 ? [...monthly].sort((a, b) => a.pct - b.pct)[0] : null;
  const piorPonto = pontoStats.length > 0 ? pontoStats.at(-1) : null;

  const primeiraMedicao = timeline[0]?.data;
  const ultimaMedicao = timeline.at(-1)?.data;

  const qualidadeTexto =
    pctGeral >= 80 ? "A qualidade da água foi boa nesta temporada." :
    pctGeral >= 50 ? "A qualidade foi moderada, com períodos de contaminação." :
    "A qualidade foi preocupante, com alta incidência de pontos impróprios.";

  const pctColor =
    pctGeral >= 67 ? { card: "bg-green-50 border-green-200", text: "text-green-700" } :
    pctGeral >= 34 ? { card: "bg-amber-50 border-amber-200", text: "text-amber-700" } :
    { card: "bg-red-50 border-red-200", text: "text-red-700" };

  return (
    <div className="space-y-6">

      {/* Seletor de temporada */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Temporada:</span>
        <div className="flex gap-1.5 flex-wrap">
          {temporadas.map((t) => (
            <button
              key={t}
              onClick={() => setTemporada(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                t === temporada
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700"
              }`}
              style={t === temporada ? { backgroundColor: seasonColor(t), borderColor: seasonColor(t) } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-4 ${pctColor.card}`}>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">% Próprias</div>
          <div className={`text-3xl font-bold ${pctColor.text}`}>{pctGeral}%</div>
          <div className="text-xs text-gray-500 mt-1">{totalProprias} de {totalMedicoes} medições</div>
        </div>
        <div className="rounded-xl border bg-gray-50 border-gray-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Coletas</div>
          <div className="text-3xl font-bold text-gray-800">{timeline.length}</div>
          <div className="text-xs text-gray-500 mt-1">{totalMedicoes} medições · {pontosAtivos} pontos</div>
        </div>
        <div className={`rounded-xl border p-4 ${melhorMes ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Melhor mês</div>
          {melhorMes ? (
            <>
              <div className="text-2xl font-bold text-green-700">{melhorMes.mesFmt}</div>
              <div className="text-xs text-gray-500 mt-1">{melhorMes.pct}% · {melhorMes.total} medições</div>
            </>
          ) : <div className="text-gray-400 text-sm mt-2">—</div>}
        </div>
        <div className={`rounded-xl border p-4 ${piorMes ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Pior mês</div>
          {piorMes ? (
            <>
              <div className="text-2xl font-bold text-red-700">{piorMes.mesFmt}</div>
              <div className="text-xs text-gray-500 mt-1">{piorMes.pct}% · {piorMes.total} medições</div>
            </>
          ) : <div className="text-gray-400 text-sm mt-2">—</div>}
        </div>
      </div>

      {/* Resumo textual */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Resumo — Temporada {temporada}</h2>
        <p className="text-sm text-blue-800 leading-relaxed">
          Na temporada {temporada}, a Lagoa da Conceição registrou{" "}
          <strong>{pctGeral}% de pontos próprios</strong> para banho em{" "}
          <strong>{totalMedicoes} medições</strong> coletadas entre{" "}
          {primeiraMedicao ? fmtData(primeiraMedicao) : "—"} e{" "}
          {ultimaMedicao ? fmtData(ultimaMedicao) : "—"}.{" "}
          {qualidadeTexto}
          {piorMes && ` O período de maior contaminação foi ${nomeMesCompleto(piorMes.mes)} (${piorMes.pct}% de pontos próprios).`}
          {piorPonto && ` O ponto mais problemático foi o Ponto ${piorPonto.ponto.ponto_num}, com ${piorPonto.pct}% de coletas próprias.`}
        </p>
      </div>

      {/* Timeline semanal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-0.5">Evolução Semanal</h2>
        <p className="text-xs text-gray-500 mb-4">
          % de pontos próprios por data de coleta · linhas tracejadas em 80% e 50%
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPropria" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="dataFmt"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(timeline.length / 8) - 1)}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={42} />
            <Tooltip content={<TimelineTooltip />} />
            <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="5 5" strokeOpacity={0.5} />
            <ReferenceLine y={50} stroke="#d97706" strokeDasharray="5 5" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="pct"
              name="% Próprias"
              stroke="#0f766e"
              fill="url(#gradPropria)"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0f766e", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h2 className="font-semibold text-gray-800 mb-0.5">Mapa de Calor — Pontos × Coletas</h2>
        <p className="text-xs text-gray-500 mb-3">
          Cada célula = uma coleta · passe o mouse para ver a data e o status
        </p>
        <table className="text-xs border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="text-left text-gray-500 font-medium pr-3 pb-2 sticky left-0 bg-white z-10 min-w-[68px] text-xs">
                Ponto
              </th>
              {heatmap.dates.map((d) => (
                <th key={d} className="px-0 pb-2 min-w-[26px] align-bottom">
                  <div
                    className="text-gray-400 font-normal mx-auto"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "9px" }}
                  >
                    {fmtData(d)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.rows.map((row) => (
              <tr key={row.ponto.id}>
                <td className="text-gray-700 font-medium pr-3 py-0.5 sticky left-0 bg-white z-10">
                  <a href={`/praia/${row.ponto.id}`} className="text-teal-700 hover:underline whitespace-nowrap text-xs">
                    P.{row.ponto.ponto_num}
                  </a>
                </td>
                {heatmap.dates.map((d) => {
                  const status = row.byDate.get(d);
                  return (
                    <td
                      key={d}
                      className="py-0.5 px-0"
                      title={`P.${row.ponto.ponto_num} · ${fmtData(d)}: ${
                        status === "propria" ? "Própria" :
                        status === "impropria" ? "Imprópria" : "Sem dados"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-sm ${
                          status === "propria" ? "bg-green-400" :
                          status === "impropria" ? "bg-red-400" :
                          "bg-gray-100"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-5 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-sm bg-green-400" />Própria
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-sm bg-red-400" />Imprópria
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-sm bg-gray-100 border border-gray-200" />Sem dados
          </span>
        </div>
      </div>

      {/* Desempenho mensal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-0.5">Desempenho Mensal</h2>
        <p className="text-xs text-gray-500 mb-4">
          % de pontos próprios agrupado por mês · verde ≥ 67% · âmbar 34–66% · vermelho &lt; 34%
        </p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mesFmt" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={42} />
            <Tooltip content={<MonthlyTooltip />} />
            <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="5 5" strokeOpacity={0.4} />
            <Bar dataKey="pct" name="% Próprias" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {monthly.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.pct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparação de temporadas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-0.5">Comparação entre Temporadas</h2>
        <p className="text-xs text-gray-500 mb-4">
          % de pontos próprios por semana relativa (semana 1 = primeira coleta de cada temporada)
          {temporadas.includes("2022-2023") && (
            <span className="ml-2 text-amber-600">· 2022–2023 incompleta (dados a partir de jan/2023)</span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={comparacao} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 10 }}
              label={{ value: "Semana da temporada", position: "insideBottom", offset: -12, fontSize: 11, fill: "#9ca3af" }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={42} />
            <Tooltip content={<ComparacaoTooltip />} />
            <Legend verticalAlign="top" height={32} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            {temporadas.map((t) => (
              <Line
                key={t}
                type="monotone"
                dataKey={t}
                stroke={seasonColor(t)}
                strokeWidth={t === temporada ? 2.5 : 1.5}
                dot={false}
                strokeOpacity={t === temporada ? 1 : 0.55}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking dos pontos */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-0.5">Ranking dos Pontos — {temporada}</h2>
        <p className="text-xs text-gray-500 mb-4">Ordenado do mais limpo ao mais problemático</p>
        <div className="space-y-2">
          {pontoStats.map((s, i) => {
            const medalColor =
              i === 0 ? "text-yellow-500" :
              i === 1 ? "text-slate-400" :
              i === 2 ? "text-amber-600" :
              "text-gray-200";
            const pct = s.pct ?? 0;
            return (
              <a
                key={s.ponto.id}
                href={`/praia/${s.ponto.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all"
              >
                <div className={`text-lg font-bold w-7 text-center shrink-0 ${medalColor}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">Ponto {s.ponto.ponto_num}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: `${barColor(pct)}22`, color: barColor(pct) }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate leading-relaxed">
                    {s.ponto.descricao}
                  </div>
                </div>
                <div className="shrink-0 text-right min-w-[88px]">
                  <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden ml-auto">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: barColor(pct) }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {s.proprias}✓ {s.improprias}✗
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Rodapé informativo */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong>Fonte:</strong> Instituto do Meio Ambiente de Santa Catarina (IMA/SC) ·{" "}
          <a
            href="https://balneabilidade.ima.sc.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            balneabilidade.ima.sc.gov.br
          </a>
        </p>
        <p>
          <strong>Padrão:</strong> Resolução CONAMA 274/2000 · Própria: até 1000 NMP/100 mL (E. coli) ·
          Imprópria: acima deste limite ou por risco à saúde
        </p>
        <p>
          <strong>Frequência:</strong> Coletas semanais durante a temporada (outubro a maio) ·
          Pontos P.96 e P.97 monitorados a partir de abril/2025
        </p>
      </div>
    </div>
  );
}
