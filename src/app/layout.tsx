import "./globals.css";
import AppChrome from "@/components/layout/AppChrome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transformação Saúde — Dra. Daiane Damasceno",
  description: "Psicóloga Clínica | Neuropsicologia",
  icons: {
    icon: "/images/transformacao-saude/logo/simbolo-integrado.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="text-slate-800 antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
