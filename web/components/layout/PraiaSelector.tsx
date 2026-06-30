"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PRAIAS, praiaSlugFromPathname } from "@/lib/praias";

export function PraiaSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const slugAtual = praiaSlugFromPathname(pathname);
  const praiaAtual = PRAIAS.find((p) => p.slug === slugAtual) ?? PRAIAS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selecionar(slug: string) {
    setAberto(false);
    router.push(`/${slug}`);
  }

  return (
    <div ref={ref} className="relative leading-tight">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1.5 group text-left"
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <div>
          <div className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-teal-100 transition-colors">
            {praiaAtual.nome}
          </div>
          <div className="text-teal-200 text-[10px] sm:text-[11px] font-medium tracking-wide uppercase flex items-center gap-1">
            Balneabilidade · Florianópolis
            <svg className={`w-3 h-3 transition-transform ${aberto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {aberto && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50" role="listbox">
          {PRAIAS.map((praia) => {
            const ativa = praia.slug === slugAtual;
            return (
              <button
                key={praia.slug}
                role="option"
                aria-selected={ativa}
                onClick={() => selecionar(praia.slug)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between gap-2 ${
                  ativa
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {praia.nome}
                {ativa && (
                  <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
