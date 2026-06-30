import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavPrincipal } from "@/components/layout/NavPrincipal";

export const metadata: Metadata = {
  title: "Balneabilidade SC — Praias de Santa Catarina",
  description:
    "Consulte o status de balneabilidade das praias de Santa Catarina. Saiba se pode nadar antes de ir à praia.",
  keywords: "balneabilidade, praias, Santa Catarina, pode nadar, IMA, qualidade água",
  authors: [{ name: "IMA-SC" }],
  openGraph: {
    title: "Balneabilidade SC",
    description: "Veja quais praias de SC estão próprias para banho",
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
        <header className="bg-teal-700 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg hover:text-teal-100 transition-colors">
              <span className="text-2xl">🌊</span>
              <span>Balneabilidade SC</span>
            </a>
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
          <p className="mt-1">Este site é uma iniciativa da comunidade para facilitar o acesso às informações públicas de balneabilidade.</p>
        </footer>
      </body>
    </html>
  );
}
