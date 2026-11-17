import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import NavigationLoader from "@/components/layout/NavigationLoader";
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
        <NavigationLoader />
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
