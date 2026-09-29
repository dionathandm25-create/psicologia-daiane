"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Paciente = {
  id: number;
  nome: string;
  nome_social: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
};

export default function PacientePage() {
  const router = useRouter();

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    async function carregarPaciente() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const resposta = await fetch(
          "/api/paciente/me",
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(
            dados.error ||
              "Não foi possível carregar seus dados."
          );
          return;
        }

        setPaciente(dados.paciente);
      } catch (error) {
        console.error(
          "ERRO AO CARREGAR ÁREA DO PACIENTE:",
          error
        );

        setErro(
          "Não foi possível carregar sua área de paciente."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPaciente();
  }, [router]);

  async function sair() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
  }

  if (carregando) {
    return (
      <main className="min-h-screen px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-center text-slate-600">
            Carregando sua área...
          </p>
        </section>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800">
            Área do paciente
          </h1>

          <p className="mt-4 text-red-600">
            {erro}
          </p>

          <button
            onClick={sair}
            className="mt-6 rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Sair
          </button>
        </section>
      </main>
    );
  }

  if (!paciente) {
    return null;
  }

  const nomeExibicao =
    paciente.nome_social?.trim() ||
    paciente.nome;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                Área do paciente
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Olá, {nomeExibicao}
              </h1>

              <p className="mt-2 text-slate-600">
                Aqui você poderá acompanhar seus agendamentos
                e informações de atendimento.
              </p>
            </div>

            <button
              onClick={sair}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Nome
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {nomeExibicao}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                E-mail
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.email || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Telefone
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.telefone || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                WhatsApp
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.whatsapp || "Não informado"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
