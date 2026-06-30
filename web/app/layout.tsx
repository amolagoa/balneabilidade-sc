import type { Metadata, Viewport } from "next";
import Image from "next/image";
import "./globals.css";
import { NavPrincipal } from "@/components/layout/NavPrincipal";
import { BemVindo } from "@/components/layout/BemVindo";
import { PraiaSelector } from "@/components/layout/PraiaSelector";

export const metadata: Metadata = {
  title: "Balneabilidade — Lagoa da Conceição · Florianópolis",
  description:
    "Status atual e histórico de balneabilidade da Lagoa da Conceição em Florianópolis. 9 pontos monitorados pelo IMA/SC.",
  keywords: "balneabilidade, Lagoa da Conceição, Florianópolis, pode nadar, IMA, qualidade água",
  authors: [{ name: "IMA-SC" }],
  openGraph: {
    title: "Balneabilidade — Lagoa da Conceição",
    description: "Veja se a Lagoa da Conceição está própria para banho",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <BemVindo />
        <header className="bg-gradient-to-r from-teal-800 to-teal-600 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

            {/* Logo + seletor de praia */}
            <div className="flex items-center gap-3 shrink-0">
              <a href="/lagoa" className="group">
                <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  <Image
                    src="/AMOLAGOA.png"
                    alt="AMOLAGOA"
                    width={110}
                    height={36}
                    className="h-8 w-auto"
                  />
                </div>
              </a>
              <PraiaSelector />
            </div>

            <NavPrincipal />
          </div>
        </header>

        {/* Aviso permanente sobre chuva */}
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs sm:text-sm px-4 py-2 text-center">
          ⚠️ <strong>Após chuvas fortes, aguarde 24–48h</strong> antes de nadar, mesmo em praias próprias.
        </div>

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        <footer className="bg-gray-100 border-t text-xs text-gray-500 text-center py-4 px-4">
          <p>Dados: <a href="https://balneabilidade.ima.sc.gov.br" className="underline hover:text-gray-700" target="_blank" rel="noopener noreferrer">IMA-SC</a> · Resolução CONAMA 274/2000 · Atualizado semanalmente</p>
          <p className="mt-1">Uma iniciativa da <a href="https://amolagoa.floripa.br" className="font-semibold text-gray-700 hover:underline" target="_blank" rel="noopener noreferrer">AMOLAGOA</a> para facilitar o acesso às informações públicas de balneabilidade.</p>
        </footer>
      </body>
    </html>
  );
}
