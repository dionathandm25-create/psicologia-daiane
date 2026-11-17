"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [progressoOcultacao, setProgressoOcultacao] = useState(0);
  const progressoRef = useRef(0);

  useEffect(() => {
    let ultimoScroll = window.scrollY;
    let quadroPendente = 0;
    const movimentoReduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function atualizarVisibilidade() {
      quadroPendente = 0;
      const scrollAtual = window.scrollY;
      const delta = scrollAtual - ultimoScroll;
      ultimoScroll = scrollAtual;

      let proximoProgresso = progressoRef.current;

      if (scrollAtual <= 16) {
        proximoProgresso = 0;
      } else if (Math.abs(delta) > 1) {
        proximoProgresso = movimentoReduzido.matches
          ? delta > 0
            ? 1
            : 0
          : Math.min(
              1,
              Math.max(0, proximoProgresso + delta / 180)
            );
      }

      if (proximoProgresso !== progressoRef.current) {
        progressoRef.current = proximoProgresso;
        setProgressoOcultacao(proximoProgresso);
      }
    }

    function agendarAtualizacao() {
      if (!quadroPendente) {
        quadroPendente = window.requestAnimationFrame(
          atualizarVisibilidade
        );
      }
    }

    window.addEventListener("scroll", agendarAtualizacao, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", agendarAtualizacao);
      if (quadroPendente) {
        window.cancelAnimationFrame(quadroPendente);
      }
    };
  }, []);

  const totalmenteOculto = progressoOcultacao >= 0.99;

  return (
    <header
      aria-hidden={totalmenteOculto}
      inert={totalmenteOculto}
      style={{
        opacity: 1 - progressoOcultacao,
        pointerEvents: totalmenteOculto ? "none" : "auto",
        transform: `translate3d(0, ${progressoOcultacao * -100}%, 0)`,
      }}
      className="sticky top-0 z-40 border-b border-[#BD6F0A] bg-[#FEEDD9] shadow-[0_8px_24px_rgba(100,2,25,0.12)] will-change-transform"
    >
      <div className="w-full">
        <Image
          src="/images/transformacao-saude/header/cabecalho-referencia-clara.jpeg"
          alt="Transformação Saúde — Dra. Daiane Damasceno"
          width={1600}
          height={533}
          priority
          sizes="100vw"
          className="block h-auto w-full object-contain"
        />
      </div>

      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-sm font-medium text-[#451326] sm:gap-6 sm:text-base"
      >
        <Link
          className="transition-colors hover:text-[#BD6F0A]"
          href="/servicos"
        >
          Início
        </Link>
        <Link
          className="transition-colors hover:text-[#BD6F0A]"
          href="/servicos"
        >
          Serviços
        </Link>
        <Link
          className="transition-colors hover:text-[#BD6F0A]"
          href="/agendar"
        >
          Agendar
        </Link>
        <Link
          className="transition-colors hover:text-[#BD6F0A]"
          href="/contato"
        >
          Contato
        </Link>
        <Link
          className="transition-colors hover:text-[#BD6F0A]"
          href="/login"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}
