"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  created_at: string;
  payment_status: string | null;
  atendimento_status: string | null;
  paciente_id: number;
};

type IconName =
  | "calendar"
  | "profile"
  | "history"
  | "support"
  | "lock"
  | "logout"
  | "arrow"
  | "clock";

type Feedback = {
  tipo: "erro" | "sucesso";
  mensagem: string;
};

const ICONES: Record<IconName, string> = {
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  profile:
    "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  history:
    "M3 12a9 9 0 1 0 2.64-6.36L3 8m0-5v5h5m4-1v5l3 2",
  support:
    "M3 11a9 9 0 0 1 18 0v5a3 3 0 0 1-3 3h-2m-4 0h4m-13-8v4a3 3 0 0 0 3 3h2v-7H6a3 3 0 0 0-3 3Zm18 0v4a3 3 0 0 1-3 3h-2v-7h2a3 3 0 0 1 3 3Z",
  lock:
    "M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4m-4 4v2",
  logout:
    "M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7",
  arrow:
    "M7 17 17 7M7 7h10v10",
  clock:
    "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

const CATEGORIAS_SUPORTE = [
  {
    titulo: "Agendamentos",
    descricao: "Dúvidas sobre horários ou consultas",
    mensagem: "Olá! Preciso de ajuda com meu agendamento.",
  },
  {
    titulo: "Acesso à conta",
    descricao: "Ajuda com login ou acesso ao painel",
    mensagem: "Olá! Preciso de ajuda com o acesso à minha conta.",
  },
  {
    titulo: "Pagamentos",
    descricao: "Dúvidas sobre pagamentos",
    mensagem: "Olá! Preciso de ajuda com um pagamento.",
  },
  {
    titulo: "Outro assunto",
    descricao: "Fale com a equipe sobre outra dúvida",
    mensagem: "Olá! Preciso de ajuda com outro assunto.",
  },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICONES[name]} />
    </svg>
  );
}

function obterDataHora(agendamento: Agendamento) {
  const data = agendamento.data?.slice(0, 10);
  const horario = agendamento.horario?.slice(0, 5);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data || "") ||
    !/^\d{2}:\d{2}$/.test(horario || "")
  ) {
    return null;
  }

  const dataHora = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dataHora.getTime()) ? null : dataHora;
}

function agendamentoEncerrado(agendamento: Agendamento) {
  const pagamento = agendamento.payment_status?.toLowerCase();
  const atendimento = agendamento.atendimento_status?.toLowerCase();

  return (
    pagamento === "rejected" ||
    pagamento === "cancelled" ||
    pagamento === "cancelado" ||
    atendimento === "finalizado" ||
    atendimento === "concluido" ||
    atendimento === "concluído"
  );
}

function formatarData(data: string) {
  if (!data) return "Data não informada";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function formatarPagamento(status: string | null) {
  switch (status) {
    case "approved":
      return {
        texto: "Pagamento aprovado",
        classe: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "pending":
    case "pendente":
      return {
        texto: "Pagamento pendente",
        classe: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "rejected":
    case "cancelled":
    case "cancelado":
      return {
        texto: "Pagamento não aprovado",
        classe: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return {
        texto: "Pagamento não informado",
        classe: "border-[#eadfd8] bg-[#faf7f4] text-[#695c56]",
      };
  }
}

function formatarAtendimento(status: string | null) {
  switch (status) {
    case "aguardando":
    case null:
      return {
        texto: "Aguardando atendimento",
        classe: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "em_andamento":
    case "em andamento":
      return {
        texto: "Atendimento em andamento",
        classe: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "finalizado":
    case "concluido":
    case "concluído":
      return {
        texto: "Atendimento finalizado",
        classe: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    default:
      return {
        texto: status,
        classe: "border-[#eadfd8] bg-[#faf7f4] text-[#695c56]",
      };
  }
}

function ConsultaCard({
  agendamento,
}: {
  agendamento: Agendamento;
}) {
  const pagamento = formatarPagamento(agendamento.payment_status);
  const atendimento = formatarAtendimento(
    agendamento.atendimento_status
  );

  return (
    <article className="brand-card rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#d9bd8f] hover:shadow-[0_16px_34px_rgba(87,35,39,0.12)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a36e56]">
            Consulta
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug text-[#4c2630]">
            {agendamento.servico}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${pagamento.classe}`}
            >
              {pagamento.texto}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${atendimento.classe}`}
            >
              {atendimento.texto}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#f0e2d3] bg-[#fcf8f2] px-4 py-3 sm:min-w-40">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#9a6c38] shadow-sm">
            <Icon name="calendar" />
          </span>
          <div>
            <p className="text-xs font-medium text-[#81736d]">
              {formatarData(agendamento.data)}
            </p>
            <p className="mt-0.5 font-bold text-[#5b3038]">
              {agendamento.horario?.slice(0, 5) || "Horário não informado"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PacientePage() {
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoAgendamentos, setCarregandoAgendamentos] =
    useState(false);
  const [saindo, setSaindo] = useState(false);
  const [solicitandoRedefinicao, setSolicitandoRedefinicao] =
    useState(false);
  const [feedbackSenha, setFeedbackSenha] = useState<Feedback | null>(null);
  const [erro, setErro] = useState("");
  const [erroAgendamentos, setErroAgendamentos] = useState("");

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

        const resposta = await fetch("/api/paciente/me", {
          cache: "no-store",
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(
            dados.error || "Não foi possível carregar seus dados."
          );
          return;
        }

        setPaciente(dados.paciente);
        setCarregandoAgendamentos(true);

        const respostaAgendamentos = await fetch(
          "/api/paciente/agendamentos",
          { cache: "no-store" }
        );
        const dadosAgendamentos = await respostaAgendamentos.json();

        if (!respostaAgendamentos.ok) {
          setErroAgendamentos(
            dadosAgendamentos.error ||
              "Não foi possível carregar seus agendamentos."
          );
        } else {
          setAgendamentos(dadosAgendamentos.agendamentos || []);
        }
      } catch (error) {
        console.error("ERRO AO CARREGAR ÁREA DO PACIENTE:", error);
        setErro("Não foi possível carregar sua área de paciente.");
      } finally {
        setCarregandoAgendamentos(false);
        setCarregando(false);
      }
    }

    carregarPaciente();
  }, [router]);

  async function sair() {
    setSaindo(true);
    setErro("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao encerrar sessão:", error);
        setErro("Não foi possível encerrar sua sessão. Tente novamente.");
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Falha ao encerrar sessão:", error);
      setErro("Não foi possível encerrar sua sessão. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  }

  async function solicitarLinkSenha() {
    setFeedbackSenha(null);

    if (!paciente?.email) {
      setFeedbackSenha({
        tipo: "erro",
        mensagem:
          "Não há um e-mail cadastrado para enviar o link de recuperação.",
      });
      return;
    }

    setSolicitandoRedefinicao(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        paciente.email.trim(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (error) {
        console.error("Erro ao solicitar redefinição de senha:", error);
        setFeedbackSenha({
          tipo: "erro",
          mensagem:
            "Não foi possível enviar o link. Tente novamente mais tarde.",
        });
        return;
      }

      setFeedbackSenha({
        tipo: "sucesso",
        mensagem:
          "Se o e-mail estiver habilitado para recuperação, você receberá as instruções para criar uma nova senha.",
      });
    } catch (error) {
      console.error("Falha ao solicitar redefinição de senha:", error);
      setFeedbackSenha({
        tipo: "erro",
        mensagem: "Ocorreu um erro ao solicitar o link de recuperação.",
      });
    } finally {
      setSolicitandoRedefinicao(false);
    }
  }

  const consultasSeparadas = useMemo(() => {
    const agora = new Date();
    const proximas: Agendamento[] = [];
    const historico: Agendamento[] = [];

    for (const agendamento of agendamentos) {
      const dataHora = obterDataHora(agendamento);
      if (
        dataHora &&
        dataHora >= agora &&
        !agendamentoEncerrado(agendamento)
      ) {
        proximas.push(agendamento);
      } else {
        historico.push(agendamento);
      }
    }

    proximas.sort(
      (a, b) =>
        (obterDataHora(a)?.getTime() ?? 0) -
        (obterDataHora(b)?.getTime() ?? 0)
    );
    historico.sort(
      (a, b) =>
        (obterDataHora(b)?.getTime() ?? 0) -
        (obterDataHora(a)?.getTime() ?? 0)
    );

    return { proximas, historico };
  }, [agendamentos]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 sm:py-16">
        <section
          aria-label="Carregando área do paciente"
          className="mx-auto max-w-6xl animate-pulse space-y-6 motion-reduce:animate-none"
        >
          <div className="h-56 rounded-[2rem] border border-[#f0dfda] bg-white/80 shadow-sm sm:h-64" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-3xl bg-white/75" />
            <div className="h-28 rounded-3xl bg-white/75" />
            <div className="h-28 rounded-3xl bg-white/75" />
          </div>
          <p className="text-center text-sm font-medium text-[#71545a]">
            Carregando sua área...
          </p>
        </section>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-[65vh] bg-transparent px-4 py-12 sm:px-6">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#f0dfda] bg-white/95 p-7 text-center shadow-[0_20px_60px_rgba(87,35,39,0.12)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Icon name="support" className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#4c2630]">
            Não foi possível abrir sua área
          </h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
            {erro}
          </p>
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#eadfd8] px-5 py-3 font-semibold text-[#5b3038] transition hover:bg-[#faf7f4] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77b45]"
          >
            <Icon name="logout" />
            {saindo ? "Saindo..." : "Sair da conta"}
          </button>
        </section>
      </main>
    );
  }

  if (!paciente) return null;

  const nomeExibicao =
    paciente.nome_social?.trim() || paciente.nome?.trim() || "Paciente";
  const iniciais = nomeExibicao
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
  const consultasCarregadas =
    !carregandoAgendamentos && !erroAgendamentos;
  const proximaConsulta = consultasSeparadas.proximas[0];

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 text-[#4c2630] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-7 sm:space-y-9">
        <section
          id="visao-geral"
          className="relative isolate scroll-mt-24 overflow-hidden rounded-[2rem] border border-[#e6d3bc] bg-gradient-to-br from-[#fffaf6] via-[#f9e9e7] to-[#f4eadb] p-6 shadow-[0_22px_55px_rgba(87,35,39,0.13)] sm:p-9 lg:p-11"
        >
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#d7bd93]/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 left-1/3 -z-10 h-56 w-56 rounded-full bg-[#e8bcc2]/30 blur-3xl"
          />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-lg font-bold text-[#7b3d4b] shadow-[0_8px_20px_rgba(87,35,39,0.1)] sm:h-16 sm:w-16 sm:text-xl"
              >
                {iniciais}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6c38]">
                  Painel do paciente
                </p>
                <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
                  Olá, {nomeExibicao}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#71545a] sm:text-base">
                  Acompanhe suas consultas e encontre os canais de suporte
                  em um só lugar.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/agendar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6a2638] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(106,38,56,0.2)] transition hover:-translate-y-0.5 hover:bg-[#57202f] hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
              >
                <Icon name="calendar" />
                Agendar consulta
              </Link>
              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d9c7bc] bg-white/75 px-5 py-3 text-sm font-semibold text-[#5b3038] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
              >
                <Icon name="logout" />
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>

          <div className="brand-card-grid mt-8 grid gap-3 border-t border-[#d7c2b5]/70 pt-6 sm:grid-cols-3 sm:gap-4">
            <div className="brand-card rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7169]">
                Próximas consultas
              </p>
              <p className="mt-1 text-2xl font-bold text-[#572936]">
                {consultasCarregadas
                  ? consultasSeparadas.proximas.length
                  : "—"}
              </p>
            </div>
            <div className="brand-card rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7169]">
                Histórico
              </p>
              <p className="mt-1 text-2xl font-bold text-[#572936]">
                {consultasCarregadas
                  ? consultasSeparadas.historico.length
                  : "—"}
              </p>
            </div>
            <div className="brand-card rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7169]">
                Próximo horário
              </p>
              {consultasCarregadas && proximaConsulta ? (
                <p className="mt-1 font-bold text-[#572936]">
                  {formatarData(proximaConsulta.data)} ·{" "}
                  {proximaConsulta.horario?.slice(0, 5)}
                </p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-[#71545a]">
                  {consultasCarregadas
                    ? "Nenhuma agendada"
                    : "Indisponível"}
                </p>
              )}
            </div>
          </div>
        </section>

        <nav
          aria-label="Navegação da área do paciente"
          className="overflow-x-auto rounded-2xl border border-[#eadfd8] bg-white/85 p-2 shadow-[0_8px_24px_rgba(87,35,39,0.06)]"
        >
          <div className="flex min-w-max gap-1">
            {[
              ["#visao-geral", "Visão geral"],
              ["#perfil", "Meu perfil"],
              ["#consultas", "Minhas consultas"],
              ["#historico", "Histórico"],
              ["#suporte", "Suporte"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#71545a] transition hover:bg-[#f8eeeb] hover:text-[#6a2638] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section aria-labelledby="atalhos-titulo">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
              Acesso rápido
            </p>
            <h2
              id="atalhos-titulo"
              className="mt-1 text-xl font-bold text-[#572936] sm:text-2xl"
            >
              O que você precisa hoje?
            </h2>
          </div>

          <div className="brand-card-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "#perfil",
                titulo: "Meu perfil",
                detalhe: "Confira seus dados cadastrais",
                icone: "profile" as const,
              },
              {
                href: "#consultas",
                titulo: "Minhas consultas",
                detalhe: "Acompanhe seus próximos horários",
                icone: "calendar" as const,
              },
              {
                href: "#historico",
                titulo: "Histórico",
                detalhe: "Consulte atendimentos anteriores",
                icone: "history" as const,
              },
              {
                href: "#suporte",
                titulo: "Central de suporte",
                detalhe: "Fale com a equipe pelo WhatsApp",
                icone: "support" as const,
              },
            ].map((atalho) => (
              <a
                key={atalho.href}
                href={atalho.href}
                className="brand-card group rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9bd8f] hover:shadow-[0_18px_34px_rgba(87,35,39,0.12)] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7ebe8] text-[#7b3d4b] transition group-hover:bg-[#efe0d5] group-hover:text-[#815b2d]">
                  <Icon name={atalho.icone} />
                </span>
                <span className="mt-4 block font-bold text-[#572936]">
                  {atalho.titulo}
                </span>
                <span className="mt-1 block text-sm leading-5 text-[#81736d]">
                  {atalho.detalhe}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section
          id="perfil"
          aria-labelledby="perfil-titulo"
          className="scroll-mt-24 rounded-[2rem] border border-[#eadfd8] bg-white/90 p-6 shadow-[0_12px_34px_rgba(87,35,39,0.08)] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
                Seus dados
              </p>
              <h2
                id="perfil-titulo"
                className="mt-1 text-2xl font-bold text-[#572936]"
              >
                Meu perfil
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfd8] bg-[#faf7f4] px-3 py-1.5 text-xs font-semibold text-[#71545a]">
              <Icon name="lock" className="h-4 w-4" />
              Somente leitura
            </span>
          </div>

          <div className="brand-card-grid mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Nome", nomeExibicao],
              ["E-mail", paciente.email || "Não informado"],
              ["Telefone", paciente.telefone || "Não informado"],
              ["WhatsApp", paciente.whatsapp || "Não informado"],
            ].map(([rotulo, valor]) => (
              <div
                key={rotulo}
                className="brand-card rounded-2xl p-4 sm:p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7169]">
                  {rotulo}
                </p>
                <p className="mt-2 break-words font-semibold text-[#4c2630]">
                  {valor}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#81736d]">
            Seus dados são exibidos conforme o cadastro vinculado à sua conta.
            A edição de perfil ainda não está disponível nesta etapa.
          </p>
        </section>

        <section
          id="consultas"
          aria-labelledby="consultas-titulo"
          className="scroll-mt-24 space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
                Agenda
              </p>
              <h2
                id="consultas-titulo"
                className="mt-1 text-2xl font-bold text-[#572936]"
              >
                Minhas consultas
              </h2>
            </div>
            {consultasCarregadas && (
              <p className="text-sm font-medium text-[#81736d]">
                {consultasSeparadas.proximas.length} próxima
                {consultasSeparadas.proximas.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {carregandoAgendamentos ? (
            <div
              role="status"
              className="rounded-3xl border border-[#eadfd8] bg-white/85 p-6 text-sm text-[#71545a]"
            >
              Carregando suas consultas...
            </div>
          ) : erroAgendamentos ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
            >
              {erroAgendamentos}
            </div>
          ) : consultasSeparadas.proximas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-7 text-center sm:p-9">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7ebe8] text-[#7b3d4b]">
                <Icon name="calendar" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#572936]">
                Você não tem consultas futuras
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81736d]">
                Quando houver uma consulta agendada, os detalhes aparecerão
                aqui.
              </p>
              <Link
                href="/agendar"
                className="brand-action mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-semibold"
              >
                Agendar consulta
              </Link>
            </div>
          ) : (
            <div className="brand-card-grid grid gap-4">
              {consultasSeparadas.proximas.map((agendamento) => (
                <ConsultaCard
                  key={agendamento.id}
                  agendamento={agendamento}
                />
              ))}
            </div>
          )}
        </section>

        <section
          id="historico"
          aria-labelledby="historico-titulo"
          className="scroll-mt-24 space-y-4"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
                Consultas anteriores
              </p>
              <h2
                id="historico-titulo"
                className="mt-1 text-2xl font-bold text-[#572936]"
              >
                Histórico
              </h2>
            </div>
            {consultasCarregadas && (
              <span className="rounded-full border border-[#eadfd8] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#71545a]">
                {consultasSeparadas.historico.length} registro
                {consultasSeparadas.historico.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {carregandoAgendamentos ? (
            <div
              role="status"
              className="rounded-3xl border border-[#eadfd8] bg-white/85 p-6 text-sm text-[#71545a]"
            >
              Carregando histórico...
            </div>
          ) : erroAgendamentos ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
            >
              {erroAgendamentos}
            </div>
          ) : consultasSeparadas.historico.length === 0 ? (
            <div className="rounded-3xl border border-[#eadfd8] bg-white/75 p-6 text-sm leading-6 text-[#81736d]">
              Seu histórico aparecerá aqui após a conclusão ou encerramento de
              uma consulta.
            </div>
          ) : (
            <div className="brand-card-grid grid gap-4">
              {consultasSeparadas.historico.map((agendamento) => (
                <ConsultaCard
                  key={agendamento.id}
                  agendamento={agendamento}
                />
              ))}
            </div>
          )}
        </section>

        <section
          id="suporte"
          aria-labelledby="suporte-titulo"
          className="scroll-mt-24 rounded-[2rem] border border-[#e6d3bc] bg-gradient-to-br from-[#fffaf6] to-[#f8eee5] p-6 shadow-[0_12px_34px_rgba(87,35,39,0.08)] sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7b3d4b] shadow-sm">
              <Icon name="support" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
                Estamos à disposição
              </p>
              <h2
                id="suporte-titulo"
                className="mt-1 text-2xl font-bold text-[#572936]"
              >
                Central de suporte
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#71545a]">
                Escolha um assunto para iniciar uma conversa pelo WhatsApp.
              </p>
            </div>
          </div>

          <div className="brand-card-grid mt-6 grid gap-3 sm:grid-cols-2">
            {CATEGORIAS_SUPORTE.map((categoria) => (
              <a
                key={categoria.titulo}
                href={`https://wa.me/5547992479888?text=${encodeURIComponent(
                  categoria.mensagem
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Falar com o suporte sobre ${categoria.titulo} pelo WhatsApp`}
                className="brand-card group flex min-h-20 items-center justify-between gap-4 rounded-2xl p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d9bd8f] hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
              >
                <span>
                  <span className="block font-bold text-[#572936]">
                    {categoria.titulo}
                  </span>
                  <span className="mt-1 block text-sm text-[#81736d]">
                    {categoria.descricao}
                  </span>
                </span>
                <Icon
                  name="arrow"
                  className="h-5 w-5 shrink-0 text-[#9a6c38] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                />
              </a>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="seguranca-titulo"
          className="brand-card-grid grid gap-4 lg:grid-cols-[1fr_1.2fr]"
        >
          <div className="brand-card rounded-3xl p-6 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7ebe8] text-[#7b3d4b]">
              <Icon name="lock" />
            </span>
            <h2
              id="seguranca-titulo"
              className="mt-4 text-lg font-bold text-[#572936]"
            >
              Alteração de senha
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#81736d]">
              Enviaremos ao seu e-mail um link seguro para criar uma nova
              senha.
            </p>
            {!paciente.email && (
              <p className="mt-3 text-sm text-amber-800">
                Não há um e-mail cadastrado para enviar o link. Entre em
                contato com o suporte para atualizar essa informação.
              </p>
            )}
            <button
              type="button"
              onClick={solicitarLinkSenha}
              disabled={solicitandoRedefinicao || !paciente.email}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9c7bc] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b3038] transition hover:bg-[#faf7f4] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
            >
              <Icon name="lock" className="h-4 w-4" />
              {solicitandoRedefinicao
                ? "Enviando instruções..."
                : "Solicitar link de redefinição"}
            </button>
            {feedbackSenha && (
              <p
                role={feedbackSenha.tipo === "erro" ? "alert" : "status"}
                aria-live="polite"
                className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-5 ${
                  feedbackSenha.tipo === "erro"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {feedbackSenha.mensagem}
              </p>
            )}
          </div>

          <div className="brand-card rounded-3xl border-dashed p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
              Próximas etapas
            </p>
            <h2 className="mt-2 text-lg font-bold text-[#572936]">
              Recursos em evolução
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#81736d]">
              Notificações e documentos ainda não estão disponíveis nesta
              área. Essas funções serão incluídas quando houver suporte real
              para apresentá-las com segurança.
            </p>
          </div>
        </section>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#d9c7bc]/70 pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs leading-5 text-[#81736d]">
            Transformação Saúde · Dra. Daiane Damasceno
          </p>
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#71545a] transition hover:bg-white/70 hover:text-[#6a2638] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
          >
            <Icon name="logout" className="h-4 w-4" />
            {saindo ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </div>
    </main>
  );
}
