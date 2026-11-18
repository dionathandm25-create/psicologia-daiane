"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavigationLoader from "@/components/layout/NavigationLoader";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";

const ROTAS_DE_AUTENTICACAO = [
  "/login",
  "/cadastro",
  "/redefinir-senha",
];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const telaDeAutenticacao =
    ROTAS_DE_AUTENTICACAO.includes(pathname) ||
    pathname.startsWith("/auth/");

  return (
    <>
      <NavigationLoader />
      {!telaDeAutenticacao && <Header />}
      <main>{children}</main>
      {!telaDeAutenticacao && <Footer />}
      {!telaDeAutenticacao && <WhatsAppFloat />}
    </>
  );
}
