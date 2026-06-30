export interface PraiaConfig {
  slug: string;
  nome: string;
  ids: string[];
  center: [number, number];
  zoom: number;
}

export const PRAIAS: PraiaConfig[] = [
  {
    slug: "lagoa",
    nome: "Lagoa da Conceição",
    ids: ["ima_257", "ima_258", "ima_259", "ima_260", "ima_261", "ima_262", "ima_337", "ima_390", "ima_391"],
    center: [-27.612, -48.462],
    zoom: 13,
  },
  {
    slug: "joaquina",
    nome: "Praia da Joaquina",
    ids: ["ima_254"],
    center: [-27.629, -48.448],
    zoom: 16,
  },
  {
    slug: "barra-da-lagoa",
    nome: "Barra da Lagoa",
    ids: ["ima_253", "ima_372"],
    center: [-27.572, -48.425],
    zoom: 15,
  },
];

export function getPraiaBySlug(slug: string): PraiaConfig | undefined {
  return PRAIAS.find((p) => p.slug === slug);
}

export function praiaSlugFromPathname(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "lagoa";
}
