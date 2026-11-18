"use client";

import Link from "next/link";
import usePatientPortalData from "./_components/usePatientPortalData";
import { formatarData, separateAppointments } from "./_components/appointments";

export default function PacientePage() {
  const {
    paciente,
    agendamentos,
    carregandoPaciente,
    carregandoAgendamentos,
    erroPaciente,
    erroAgendamentos,
  } = usePatientPortalData();
  const consultas = separateAppointments(agendamentos);
  const proximaConsulta = consultas.proximas[0];
  const nomeExibicao =
    paciente?.nome_social?.trim() || paciente?.nome?.trim() || "Paciente";

  if (carregandoPaciente) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="animate-pulse rounded-[2rem] border border-[#f0dfda] bg-white/80 p-8 shadow-sm motion-reduce:animate-none">
          <div className="h-8 w-2/3 rounded bg-[#f3e5e2]" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-[#f3e5e2]" />
          <p role="status" className="mt-8 text-sm text-[#71545a]">
            Carregando sua área...
          </p>
        </div>
      </main>
    );
  }

  if (erroPaciente || !paciente) {
    return (
      <main className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-red-200 bg-white/95 p-7 shadow-sm">
          <h1 className="text-2xl font-bold text-[#572936]">
            Não foi possível abrir sua área
          </h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
            {erroPaciente || "Não foi possível localizar seu cadastro."}
          </p>
          <Link
            href="/login"
            className="brand-action mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-semibold"
          >
            Voltar ao login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-7 text-[#4c2630] sm:space-y-9">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#e6d3bc] bg-gradient-to-br from-[#fffaf6] via-[#f9e9e7] to-[#f4eadb] p-6 shadow-[0_22px_55px_rgba(87,35,39,0.13)] sm:p-9 lg:p-11">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#d7bd93]/20 blur-3xl"
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6c38]">
              Área do paciente
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
              Olá, {nomeExibicao}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71545a] sm:text-base">
              Consulte seus dados e acompanhe seus horários em espaços
              separados.
            </p>
          </div>
          <Link
            href="/agendar"
            className="brand-action inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-5 py-3 font-semibold"
          >
            Agendar consulta
          </Link>
        </div>
      </section>

      <section aria-labelledby="proxima-consulta-titulo">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
            Sua agenda
          </p>
          <h2
            id="proxima-consulta-titulo"
            className="mt-1 text-2xl font-bold text-[#572936]"
          >
            Próxima consulta
          </h2>
        </div>

        {carregandoAgendamentos ? (
          <div role="status" className="rounded-3xl bg-white/85 p-6 text-sm text-[#71545a]">
            Carregando suas consultas...
          </div>
        ) : erroAgendamentos ? (
          <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {erroAgendamentos}
          </div>
        ) : proximaConsulta ? (
          <article className="brand-card flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-bold text-[#572936]">
                {proximaConsulta.servico}
              </p>
              <p className="mt-1 text-sm text-[#71545a]">
                {formatarData(proximaConsulta.data)} ·{" "}
                {proximaConsulta.horario?.slice(0, 5)}
              </p>
            </div>
            <Link
              href="/paciente/consultas"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-4 py-2 text-sm font-semibold text-[#6a2638] hover:bg-[#f8eeeb]"
            >
              Ver minhas consultas
            </Link>
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-6">
            <p className="font-semibold text-[#572936]">
              Nenhuma consulta futura encontrada
            </p>
            <p className="mt-2 text-sm leading-6 text-[#81736d]">
              Quando houver uma consulta agendada, ela aparecerá nesta área.
            </p>
          </div>
        )}
      </section>

      <section aria-label="Acessos rápidos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/paciente/perfil",
            title: "Meu perfil",
            description: "Confira os dados vinculados à sua conta.",
          },
          {
            href: "/paciente/historico",
            title: "Histórico",
            description: carregandoAgendamentos
              ? "Carregando registros de consultas anteriores."
              : erroAgendamentos
                ? "Não foi possível carregar o histórico."
                : `${consultas.historico.length} registro(s) de consultas anteriores.`,
          },
          {
            href: "/paciente/suporte",
            title: "Suporte",
            description: "Encontre os canais de contato disponíveis.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="brand-card rounded-3xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
          >
            <h2 className="font-bold text-[#572936]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#81736d]">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
