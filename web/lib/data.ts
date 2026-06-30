import type { Ponto, Municipio, Resumo, PontoHistorico, Meta } from "./types";
import fs from "fs";
import path from "path";

function readJson<T>(relPath: string): T {
  const filePath = path.join(process.cwd(), "public", "data", relPath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export async function getMeta(): Promise<Meta> {
  return readJson<Meta>("meta.json");
}

export async function getPontos(): Promise<Ponto[]> {
  return readJson<Ponto[]>("pontos.json");
}

export async function getMunicipios(): Promise<Municipio[]> {
  return readJson<Municipio[]>("municipios.json");
}

export async function getResumos(): Promise<Resumo[]> {
  return readJson<Resumo[]>("resumos.json");
}

export async function getPontoHistorico(id: string): Promise<PontoHistorico> {
  return readJson<PontoHistorico>(`por_ponto/${id}.json`);
}

export async function getMunicipioData(slug: string): Promise<{ municipio: Municipio; pontos: Ponto[] }> {
  return readJson(`por_municipio/${slug}.json`);
}

// Funções utilitárias re-exportadas de utils para conveniência em server components
export { formatDate, statusLabel, statusColor, statusBg } from "./utils";

export function groupByTemporada(resumos: Resumo[]): Record<string, Resumo[]> {
  const map: Record<string, Resumo[]> = {};
  for (const r of resumos) {
    if (!map[r.temporada]) map[r.temporada] = [];
    map[r.temporada].push(r);
  }
  return map;
}

export function sortTemporadas(temporadas: string[]): string[] {
  return [...temporadas].sort((a, b) => {
    const ya = parseInt(a.split("-")[0]);
    const yb = parseInt(b.split("-")[0]);
    return ya - yb;
  });
}
