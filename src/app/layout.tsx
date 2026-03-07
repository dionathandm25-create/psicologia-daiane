import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dra. Daiane Damasceno",
  description: "Psicóloga Clínica | Neuropsicologia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          backgroundImage: "url('/fundo-rosa-certo.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          minHeight: "100vh",
        }}
        className="text-slate-800 antialiased"
      >
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
