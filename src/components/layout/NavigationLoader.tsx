"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLoadingIndicator from "@/components/layout/BrandLoadingIndicator";

const ATRASO_MINIMO_MS = 180;
const TEMPO_LIMITE_MS = 8000;

export default function NavigationLoader() {
  const pathname = usePathname();
  const [visivel, setVisivel] = useState(true);
  const pathnameAnterior = useRef(pathname);
  const timerInicial = useRef<number | null>(null);
  const timerNavegacao = useRef<number | null>(null);
  const timerSeguranca = useRef<number | null>(null);

  useEffect(() => {
    timerInicial.current = window.setTimeout(
      () => setVisivel(false),
      420
    );

    return () => {
      if (timerInicial.current !== null) {
        window.clearTimeout(timerInicial.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pathnameAnterior.current === pathname) return;

    pathnameAnterior.current = pathname;

    if (timerNavegacao.current !== null) {
      window.clearTimeout(timerNavegacao.current);
      timerNavegacao.current = null;
    }
    if (timerSeguranca.current !== null) {
      window.clearTimeout(timerSeguranca.current);
      timerSeguranca.current = null;
    }
    if (timerInicial.current !== null) {
      window.clearTimeout(timerInicial.current);
      timerInicial.current = null;
    }

    const quadro = window.requestAnimationFrame(() =>
      setVisivel(false)
    );

    return () => window.cancelAnimationFrame(quadro);
  }, [pathname]);

  useEffect(() => {
    function iniciarNavegacao(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const alvo = event.target;
      if (!(alvo instanceof Element)) return;

      const link = alvo.closest<HTMLAnchorElement>("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      ) {
        return;
      }

      const destino = new URL(link.href, window.location.href);
      if (
        destino.origin !== window.location.origin ||
        destino.pathname === window.location.pathname
      ) {
        return;
      }

      if (timerInicial.current !== null) {
        window.clearTimeout(timerInicial.current);
        timerInicial.current = null;
      }
      if (timerNavegacao.current !== null) {
        window.clearTimeout(timerNavegacao.current);
      }

      timerNavegacao.current = window.setTimeout(() => {
        setVisivel(true);
        timerSeguranca.current = window.setTimeout(
          () => setVisivel(false),
          TEMPO_LIMITE_MS
        );
      }, ATRASO_MINIMO_MS);
    }

    document.addEventListener("click", iniciarNavegacao, true);

    return () => {
      document.removeEventListener("click", iniciarNavegacao, true);
      if (timerNavegacao.current !== null) {
        window.clearTimeout(timerNavegacao.current);
      }
      if (timerSeguranca.current !== null) {
        window.clearTimeout(timerSeguranca.current);
      }
    };
  }, []);

  if (!visivel) return null;

  return <BrandLoadingIndicator overlay />;
}
