"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { praiaSlugFromPathname } from "@/lib/praias";

const SUB_PAGES = [
  { sub: "", label: "Último Relatório" },
  { sub: "/analise", label: "Análise por Temporada" },
  { sub: "/pontos", label: "Análise por Ponto" },
  { sub: "/mapa", label: "Mapa" },
];

function isAtivo(pathname: string, href: string): boolean {
  const norm = pathname.replace(/\/$/, "") || "/";
  return norm === href || pathname === href + "/";
}

export function NavPrincipal() {
  const pathname = usePathname();
  const slug = praiaSlugFromPathname(pathname);
  const base = `/${slug}`;

  const links = SUB_PAGES.map(({ sub, label }) => ({ href: `${base}${sub}`, label }));

  return (
    <>
      {/* Desktop */}
      <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
        {links.map((link) => {
          const ativo = isAtivo(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                ativo
                  ? "px-3 py-1.5 rounded-lg bg-white text-teal-700 font-bold shadow"
                  : "px-3 py-1.5 rounded-lg text-teal-100 hover:bg-white/20 hover:text-white transition-colors"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile */}
      <nav className="flex sm:hidden items-center gap-1 text-xs font-medium overflow-x-auto">
        {links.map((link) => {
          const ativo = isAtivo(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                ativo
                  ? "whitespace-nowrap px-2.5 py-1 rounded-lg bg-white text-teal-700 font-bold shadow"
                  : "whitespace-nowrap px-2.5 py-1 rounded-lg text-teal-100 hover:bg-white/20 hover:text-white transition-colors"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
