"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isAdminUser } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";

export type DashboardNavigationItem = {
  label: string;
  href: string;
};

type DashboardShellProps = {
  area: "admin" | "paciente";
  navigation: DashboardNavigationItem[];
  children: ReactNode;
};

export default function DashboardShell({
  area,
  navigation,
  children,
}: DashboardShellProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const menuAberto = menuAbertoEm === pathname;

  useEffect(() => {
    let ativo = true;

    async function verificarAcesso() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!ativo) return;

        if (!user) {
          if (userError && userError.name !== "AuthSessionMissingError") {
            console.error("Não foi possível verificar o acesso ao painel:", userError);
            setErro("Não foi possível verificar seu acesso. Tente novamente.");
            setVerificando(false);
            return;
          }

          router.replace("/login");
          return;
        }

        if (userError) {
          console.error("Não foi possível verificar o acesso ao painel:", userError);
          setErro("Não foi possível verificar seu acesso. Tente novamente.");
          setVerificando(false);
          return;
        }

        const usuarioAdmin = isAdminUser(user);

        if (area === "admin" && !usuarioAdmin) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            console.error("Não foi possível encerrar uma sessão sem acesso administrativo:", signOutError);
          }
          router.replace("/login");
          return;
        }

        if (area === "paciente" && usuarioAdmin) {
          router.replace("/admin");
          return;
        }

        setAutorizado(true);
        setVerificando(false);
      } catch (accessError) {
        if (!ativo) return;
        console.error("Falha ao verificar acesso ao painel:", accessError);
        setErro("Não foi possível verificar seu acesso. Tente novamente.");
        setVerificando(false);
      }
    }

    void verificarAcesso();

    return () => {
      ativo = false;
    };
  }, [area, router]);

  async function sair() {
    setErro("");

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Não foi possível encerrar a sessão:", signOutError);
        setErro("Não foi possível encerrar sua sessão. Tente novamente.");
        return;
      }

      router.replace("/login");
    } catch (signOutError) {
      console.error("Falha ao encerrar a sessão:", signOutError);
      setErro("Não foi possível encerrar sua sessão. Tente novamente.");
    }
  }

  if (verificando || !autorizado) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-xl rounded-3xl border border-[#eadfd8] bg-white/95 p-8 text-center shadow-[0_16px_40px_rgba(87,35,39,0.1)]">
          <Image
            src="/images/transformacao-saude/logo/simbolo-integrado.png"
            alt=""
            width={56}
            height={56}
            className="mx-auto h-14 w-14 object-contain"
          />
          <h1 className="mt-4 text-xl font-bold text-[#572936]">
            {erro ? "Acesso não verificado" : "Carregando painel"}
          </h1>
          <p
            role={erro ? "alert" : "status"}
            className={`mt-2 text-sm leading-6 ${
              erro ? "text-red-700" : "text-[#71545a]"
            }`}
          >
            {erro || "Aguarde enquanto confirmamos sua sessão."}
          </p>
          {erro && (
            <Link
              href="/login"
              className="brand-action mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-semibold"
            >
              Ir para o login
            </Link>
          )}
        </section>
      </div>
    );
  }

  const nomeArea =
    area === "admin" ? "Painel administrativo" : "Área do paciente";

  function linkAtivo(href: string) {
    if (
      area === "admin" &&
      href === "/admin/atendimentos" &&
      pathname.startsWith("/atendimento/")
    ) {
      return true;
    }

    if (href === "/admin" || href === "/paciente") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen text-[#4c2630]">
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 hidden flex-col border-r border-[#eadfd8] bg-[#fffaf6]/95 shadow-[8px_0_30px_rgba(87,35,39,0.06)] backdrop-blur-md lg:flex">
        <Brand area={area} />

        <nav
          aria-label={`Navegação ${nomeArea.toLowerCase()}`}
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {navigation.map((item) => (
            <DashboardLink
              key={item.href}
              item={item}
              active={linkAtivo(item.href)}
              onClick={() => setMenuAbertoEm(null)}
            />
          ))}
        </nav>

        <div className="border-t border-[#eadfd8] p-4">
          {erro && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}
          <button
            type="button"
            onClick={sair}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-4 py-2 text-sm font-semibold text-[#71545a] transition hover:border-[#d8b8b2] hover:bg-[#f8eeeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="dashboard-layout-content min-h-screen">
        <header className="sticky top-0 z-30 border-b border-[#eadfd8] bg-[#fffaf6]/95 shadow-sm backdrop-blur-md lg:hidden">
          <div className="relative flex min-h-[68px] items-center justify-between gap-3 px-4 py-2">
            <Brand area={area} compact />
            <button
              type="button"
              aria-expanded={menuAberto}
              aria-controls="dashboard-mobile-navigation"
              aria-label={menuAberto ? "Fechar navegação" : "Abrir navegação"}
              onClick={() =>
                setMenuAbertoEm(menuAberto ? null : pathname)
              }
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eadfd8] bg-white text-[#640219] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
            >
              <span className="flex w-[18px] flex-col gap-1" aria-hidden="true">
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
              </span>
            </button>
          </div>

          {menuAberto && (
            <nav
              id="dashboard-mobile-navigation"
              aria-label={`Navegação ${nomeArea.toLowerCase()}`}
              className="absolute left-0 right-0 z-50 max-h-[75vh] overflow-y-auto border-b border-[#eadfd8] bg-[#fffaf6] p-3 shadow-[0_16px_30px_rgba(87,35,39,0.12)]"
            >
              <div className="grid gap-1 sm:grid-cols-2">
                {navigation.map((item) => (
                  <DashboardLink
                    key={item.href}
                    item={item}
                    active={linkAtivo(item.href)}
                    onClick={() => setMenuAbertoEm(null)}
                  />
                ))}
                <button
                  type="button"
                  onClick={sair}
                  className="min-h-11 rounded-xl border border-[#eadfd8] bg-white px-4 py-2 text-left text-sm font-semibold text-[#71545a] transition hover:bg-[#f8eeeb]"
                >
                  Sair da conta
                </button>
              </div>
              {erro && (
                <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erro}
                </p>
              )}
            </nav>
          )}
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function Brand({
  area,
  compact = false,
}: {
  area: "admin" | "paciente";
  compact?: boolean;
}) {
  return (
    <Link
      href={area === "admin" ? "/admin" : "/paciente"}
      aria-label="Transformação Saúde — início do painel"
      className={`flex min-w-0 items-center gap-2.5 ${
        compact ? "flex-1" : "border-b border-[#eadfd8] px-5 py-5"
      }`}
    >
      <Image
        src="/images/transformacao-saude/logo/simbolo-integrado.png"
        alt=""
        width={48}
        height={48}
        className={`shrink-0 object-contain ${compact ? "h-10 w-10" : "h-12 w-12"}`}
      />
      <span className="min-w-0 leading-tight">
        <span className="block whitespace-normal text-[13px] font-bold tracking-wide text-[#640219] sm:text-sm">
          Transformação Saúde
        </span>
        <span className="mt-1 block whitespace-normal text-[10px] font-medium tracking-wide text-[#805c48]">
          Dra. Daiane Damasceno
        </span>
      </span>
    </Link>
  );
}

function DashboardLink({
  item,
  active,
  onClick,
}: {
  item: DashboardNavigationItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38] ${
        active
          ? "bg-[#f3e5e2] text-[#640219]"
          : "text-[#71545a] hover:bg-[#f8eeeb] hover:text-[#640219]"
      }`}
    >
      {item.label}
    </Link>
  );
}
