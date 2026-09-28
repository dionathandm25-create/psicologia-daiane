"use client";

import { useEffect, useState } from "react";

export default function AtendimentoPage() {
  const [segundos, setSegundos] = useState(0);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    if (!iniciado || finalizado) return;

    const intervalo = setInterval(() => {
      setSegundos((atual) => atual + 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [iniciado, finalizado]);

  function formatarTempo(total: number) {
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundosRestantes = total % 60;

    return [
      horas.toString().padStart(2, "0"),
      minutos.toString().padStart(2, "0"),
      segundosRestantes.toString().padStart(2, "0"),
    ].join(":");
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white/90 p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
          Atendimento psicológico
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-800">
          Dionathan Duarte Martins
        </h1>

        <p className="mt-3 text-lg text-slate-600">
          Consulta inicial
        </p>

        <div className="mt-6 rounded-2xl bg-rose-50 p-5">
          <p className="text-sm text-slate-500">
            Consulta agendada
          </p>

          <p className="mt-2 text-lg font-semibold text-slate-800">
            13/03/2026 às 22:00
          </p>
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tempo de atendimento
          </p>

          <p className="mt-3 text-6xl font-bold tracking-wider text-slate-800">
            {formatarTempo(segundos)}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {!iniciado && !finalizado && (
            <button
              type="button"
              onClick={() => setIniciado(true)}
              className="rounded-2xl bg-green-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-green-700"
            >
              Iniciar atendimento
            </button>
          )}

          {iniciado && !finalizado && (
            <button
              type="button"
              onClick={() => setFinalizado(true)}
              className="rounded-2xl bg-red-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Finalizar atendimento
            </button>
          )}

          {finalizado && (
            <div className="rounded-2xl bg-green-50 px-8 py-4 font-semibold text-green-700">
              Atendimento finalizado
            </div>
          )}

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-2xl border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
