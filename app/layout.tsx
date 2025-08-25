// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PriceTracker",
  description: "Rastreie preços de eletrônicos no Brasil (KaBuM, Terabyte, Pichau)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-neutral-50 text-neutral-900`}>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">PriceTracker</a>
            <nav className="text-sm text-neutral-600">
              <a href="/" className="hover:underline">Início</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mt-8 border-t bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-neutral-500">
            Feito com Next.js
          </div>
        </footer>
      </body>
    </html>
  );
}
