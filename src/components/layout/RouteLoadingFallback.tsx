"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLoadingIndicator from "@/components/layout/BrandLoadingIndicator";

const TEMPO_LIMITE_MS = 15000;

export default function RouteLoadingFallback() {
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setTempoEsgotado(true),
      TEMPO_LIMITE_MS
    );

    return () => window.clearTimeout(timer);
  }, []);

  if (!tempoEsgotado) {
    return <BrandLoadingIndicator overlay />;
  }

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FEEDD9]/90 px-6 text-center backdrop-blur-[2px]"
    >
      <h1 className="text-xl font-bold text-[#640219]">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#451326]/80">
        Verifique sua conexão e tente novamente.
      </p>
      <Link
        href="/servicos"
        className="brand-action mt-6 rounded-xl px-6 py-3 font-semibold"
      >
        Voltar aos serviços
      </Link>
    </div>
  );
}
