export function slugifyText(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function praiaPageSlug(municipioSlug: string, praiaNome: string): string {
  return `${municipioSlug}__${slugifyText(praiaNome)}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function statusLabel(status: string | null): string {
  if (status === "propria") return "Própria";
  if (status === "impropria") return "Imprópria";
  return "Sem dados";
}

export function statusColor(status: string | null): string {
  if (status === "propria") return "#16a34a";
  if (status === "impropria") return "#dc2626";
  return "#9ca3af";
}

export function statusBg(status: string | null): string {
  if (status === "propria") return "bg-propria-light text-propria-text";
  if (status === "impropria") return "bg-impropria-light text-impropria-text";
  return "bg-gray-100 text-gray-600";
}
