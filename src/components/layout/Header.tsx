"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isAdminUser,
  type AuthenticatedUser,
} from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";

type Acesso = "publico" | "paciente" | "admin" | null;
type ItemNavegacao = { label: string; href: string };

export default function Header() {
  const pathname = usePathname();
  const [acesso, setAcesso] = useState<Acesso>(null);
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null);
  const [progressoOcultacao, setProgressoOcultacao] = useState(0);
  const progressoRef = useRef(0);
  const caminhoAtual = pathname ?? "";
  const menuAberto = Boolean(caminhoAtual && menuAbertoEm === caminhoAtual);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();

    function atualizarAcesso(user: AuthenticatedUser) {
      if (!ativo) return;
      setAcesso(user ? (isAdminUser(user) ? "admin" : "paciente") : "publico");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      atualizarAcesso(session?.user);
    });

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!ativo) return;

        if (error) {
          if (error.name === "AuthSessionMissingError") {
            atualizarAcesso(null);
            return;
          }

          console.error("Não foi possível determinar a navegação da conta:", error);
          return;
        }

        atualizarAcesso(data.user);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        console.error("Falha ao carregar o perfil de navegação:", error);
      });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ultimoScroll = window.scrollY;
    let quadroPendente = 0;
    const movimentoReduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function atualizarCabeçalho() {
      quadroPendente = 0;
      if (menuAberto) return;

      const scrollAtual = window.scrollY;
      const diferenca = scrollAtual - ultimoScroll;
      ultimoScroll = scrollAtual;

      let proximoProgresso = progressoRef.current;
      if (scrollAtual <= 12) {
        proximoProgresso = 0;
      } else if (Math.abs(diferenca) >= 1) {
        proximoProgresso = movimentoReduzido.matches
          ? diferenca > 0
            ? 1
            : 0
          : Math.min(
              1,
              Math.max(0, progressoRef.current + diferenca / 170)
            );
      }

      if (proximoProgresso !== progressoRef.current) {
        progressoRef.current = proximoProgresso;
        setProgressoOcultacao(proximoProgresso);
      }
    }

    function aoRolar() {
      if (quadroPendente) return;
      quadroPendente = window.requestAnimationFrame(atualizarCabeçalho);
    }

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (quadroPendente) window.cancelAnimationFrame(quadroPendente);
    };
  }, [menuAberto]);

  const itens: ItemNavegacao[] =
    acesso === "admin"
      ? [
          { label: "Painel", href: "/admin" },
          { label: "Agenda", href: "/admin/agenda" },
          { label: "Pacientes", href: "/admin/pacientes" },
          { label: "Financeiro", href: "/admin/financeiro" },
        ]
      : acesso === "paciente"
        ? [
            { label: "Meu painel", href: "/paciente" },
            { label: "Consultas", href: "/paciente/consultas" },
            { label: "Histórico", href: "/paciente/historico" },
            { label: "Agendar", href: "/agendar" },
            { label: "Suporte", href: "/paciente/suporte" },
          ]
        : acesso === "publico"
          ? [
              { label: "Serviços", href: "/servicos" },
              { label: "Agendar", href: "/agendar" },
              { label: "Contato", href: "/contato" },
              { label: "Entrar", href: "/login" },
            ]
          : [];

  const rotaInicial =
    acesso === "admin"
      ? "/admin"
      : acesso === "paciente"
        ? "/paciente"
        : "/servicos";
  const totalmenteOculto = progressoOcultacao >= 1 && !menuAberto;

  function alternarMenu() {
    const abrindo = !menuAberto;
    setMenuAbertoEm(abrindo ? caminhoAtual : null);
    if (abrindo) {
      progressoRef.current = 0;
      setProgressoOcultacao(0);
    }
  }

  return (
    <header
      aria-hidden={totalmenteOculto}
      inert={totalmenteOculto}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMenuAbertoEm(null);
      }}
      className="sticky top-0 z-40 w-full border-b border-[#BD6F0A]/15 bg-[#fffaf3]/95 shadow-[0_6px_24px_rgba(100,2,25,0.07)] backdrop-blur-md transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none"
      style={{
        opacity: 1 - progressoOcultacao,
        pointerEvents: totalmenteOculto ? "none" : "auto",
        transform: `translateY(${-100 * progressoOcultacao}%)`,
      }}
    >
      <div       className="relative mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:min-h-[76px] lg:px-8">
        <Link
          href={rotaInicial}
          aria-label="Transformação Saúde — página inicial"
          onClick={() => setMenuAbertoEm(null)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BD6F0A] sm:flex-initial sm:gap-3"
        >
          <Image
            src="/images/transformacao-saude/logo/simbolo-integrado.png"
            alt=""
            width={48}
            height={48}
            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
          />
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-normal text-[13px] font-bold tracking-wide text-[#640219] sm:text-base">
              Transformação Saúde
            </span>
            <span className="mt-1 block whitespace-normal text-[10px] font-medium tracking-wide text-[#805c48] sm:text-xs">
              Dra. Daiane Damasceno
            </span>
          </span>
        </Link>

        {itens.length > 0 && (
          <>
            <button
              type="button"
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
              aria-controls="navegacao-principal"
              onClick={alternarMenu}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#640219]/10 bg-white text-[#640219] transition hover:border-[#BD6F0A]/50 hover:bg-[#fff7ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BD6F0A] lg:hidden"
            >
              <span className="sr-only">
                {menuAberto ? "Fechar navegação" : "Abrir navegação"}
              </span>
              <span className="flex w-[18px] flex-col gap-[5px]" aria-hidden="true">
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-transform ${
                    menuAberto ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-opacity ${
                    menuAberto ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-transform ${
                    menuAberto ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>

            <nav
              id="navegacao-principal"
              aria-label="Navegação principal"
              className={`${
                menuAberto ? "flex" : "hidden"
              } absolute left-0 right-0 top-full z-50 flex-col gap-1 rounded-b-2xl border border-t-0 border-[#BD6F0A]/15 bg-[#fffaf3] p-3 shadow-[0_16px_30px_rgba(100,2,25,0.12)] lg:static lg:flex lg:flex-row lg:items-center lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
            >
              {itens.map((item) => {
                const ativo =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    item.href !== "/paciente" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={ativo ? "page" : undefined}
                    onClick={() => setMenuAbertoEm(null)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BD6F0A] lg:px-3 lg:py-2 ${
                      ativo
                        ? "bg-[#640219]/[0.06] text-[#640219]"
                        : "text-[#634d4d] hover:bg-[#640219]/[0.05] hover:text-[#640219]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
