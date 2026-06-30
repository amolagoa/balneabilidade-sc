"use client";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Geral", exact: true },
  { href: "/cidades", label: "Cidades" },
  { href: "/praias", label: "Praias" },
  { href: "/mapa", label: "Mapa" },
  { href: "/temporadas", label: "Evolução" },
  { href: "/relatorios", label: "Relatórios" },
];

export function NavPrincipal() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop */}
      <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
        {links.map((link) => {
          const ativo = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              className={`transition-colors pb-0.5 ${
                ativo
                  ? "text-white border-b-2 border-white"
                  : "text-teal-100 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      {/* Mobile */}
      <nav className="flex sm:hidden items-center gap-3 text-xs font-medium overflow-x-auto">
        {links.map((link) => {
          const ativo = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap transition-colors ${
                ativo
                  ? "text-white font-bold border-b-2 border-white pb-0.5"
                  : "text-teal-100 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
