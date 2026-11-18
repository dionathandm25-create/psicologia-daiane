import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/auth/redirects";
import {
  horariosPorDia,
  obterDiaSemana,
} from "@/lib/horarios";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createGuestPaymentToken } from "@/lib/security/guest-payment-token";

function dataISOValida(data: unknown): data is string {
  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataUTC.getUTCFullYear() === ano &&
    dataUTC.getUTCMonth() === mes - 1 &&
    dataUTC.getUTCDate() === dia
  );
}

function obterHojeEmSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  const dia = partes.find((parte) => parte.type === "day")?.value;

  return `${ano}-${mes}-${dia}`;
}

const tabelaPrecos: Record<string, number> = {
  "Consulta inicial": 280,
  "Consulta sessão": 280,
  "Pacote com 10 ou mais sessões": 210,
  "Avaliação neuropsicológica - TDAH": 1050,
  "Avaliação neuropsicológica - TEA": 1050,
  "Avaliação neuropsicológica - QI": 1050,
  "Laudos neuropsicológicos": 1050,
  "Aplicação ABA": 280,
  "Pacote com 10 ou mais sessões ABA": 210,
  "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias": 750,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      cpf,
      email,
      telefone,
      servico,
      data,
      horario,
    } = body;

    if (!nome || !email || !servico || !data || !horario) {
      return NextResponse.json(
        {
          error: "Preencha os campos obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (!dataISOValida(data)) {
      return NextResponse.json(
        {
          error: "A data informada é inválida.",
        },
        { status: 400 }
      );
    }

    if (data < obterHojeEmSaoPaulo()) {
      return NextResponse.json(
        {
          error: "Escolha uma data de hoje em diante.",
        },
        { status: 400 }
      );
    }

    const horariosDoDia = horariosPorDia[obterDiaSemana(data)] || [];

    if (!horariosDoDia.includes(horario)) {
      return NextResponse.json(
        {
          error:
            "O horário escolhido não está disponível para essa data.",
        },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.error(
        "CONFIGURAÇÃO DO SUPABASE NÃO ENCONTRADA."
      );

      return NextResponse.json(
        {
          error:
            "Configuração do servidor não encontrada.",
        },
        { status: 500 }
      );
    }

    /*
     * O preço é definido no servidor.
     * Assim, o cliente não consegue escolher
     * um valor diferente através do navegador.
     */
    const valor = tabelaPrecos[servico] ?? null;

    const supabase = createClient(
      url,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const sessionClient = await createServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    const authenticatedPatient =
      user && !isAdminUser(user) ? user : null;
    const submittedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const emailPaciente =
      authenticatedPatient?.email?.trim().toLowerCase() ||
      submittedEmail;

    if (!emailPaciente) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para o agendamento." },
        { status: 400 }
      );
    }

    const nomeInformado = String(nome).trim();
    const telefoneInformado =
      typeof telefone === "string" ? telefone.trim() : "";
    const cpfInformado = typeof cpf === "string" ? cpf.trim() : "";

    /*
     * 1. Verifica se o horário já está ocupado.
     */
    const {
      data: agendamentoExistente,
      error: erroBuscaHorario,
    } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("data", data)
      .eq("horario", horario)
      .maybeSingle();

    if (erroBuscaHorario) {
      console.error(
        "ERRO AO VERIFICAR HORÁRIO:",
        erroBuscaHorario
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar a disponibilidade do horário.",
        },
        { status: 500 }
      );
    }

    if (agendamentoExistente) {
      return NextResponse.json(
        {
          error:
            "Esse horário já foi ocupado. Escolha outro.",
        },
        { status: 409 }
      );
    }

    /*
     * 2. Normaliza os dados.
     */
    let paciente:
      | {
          id: number;
          nome: string;
          email: string | null;
          telefone: string | null;
        }
      | null = null;

    if (authenticatedPatient) {
      const { data: pacientesVinculados, error: erroVinculo } =
        await supabase
          .from("pacientes")
          .select("id, nome, email, telefone")
          .eq("usuario_id", authenticatedPatient.id)
          .limit(2);

      if (erroVinculo) {
        console.error("ERRO AO VERIFICAR VÍNCULO DO PACIENTE:", erroVinculo);
        return NextResponse.json(
          { error: "Não foi possível verificar seu cadastro." },
          { status: 500 }
        );
      }

      if (pacientesVinculados && pacientesVinculados.length > 1) {
        return NextResponse.json(
          { error: "Há mais de um cadastro vinculado à sua conta." },
          { status: 409 }
        );
      }

      paciente = pacientesVinculados?.[0] ?? null;
    }

    if (!paciente) {
      const { data: pacientesPorEmail, error: erroBuscaPaciente } =
        await supabase
          .from("pacientes")
          .select("id")
          .eq("email", emailPaciente)
          .limit(2);

      if (erroBuscaPaciente) {
        console.error(
          "ERRO AO PROCURAR PACIENTE:",
          erroBuscaPaciente
        );
        return NextResponse.json(
          { error: "Não foi possível verificar o cadastro." },
          { status: 500 }
        );
      }

      if (pacientesPorEmail && pacientesPorEmail.length > 0) {
        return NextResponse.json(
          {
            error:
              "Não foi possível vincular esse cadastro. Entre na sua conta ou use outro e-mail.",
          },
          { status: 409 }
        );
      }

      const { data: novoPaciente, error: erroCriacaoPaciente } =
        await supabase
          .from("pacientes")
          .insert({
            nome: nomeInformado,
            email: emailPaciente,
            telefone: telefoneInformado || null,
            cpf: cpfInformado || null,
            status: "ativo",
            ...(authenticatedPatient
              ? { usuario_id: authenticatedPatient.id }
              : {}),
          })
          .select("id, nome, email, telefone")
          .single();

      if (erroCriacaoPaciente || !novoPaciente) {
        if (erroCriacaoPaciente?.code === "23505") {
          return NextResponse.json(
            {
              error:
                "Esse e-mail já possui cadastro. Entre na sua conta para continuar.",
            },
            { status: 409 }
          );
        }

        console.error(
          "ERRO AO CRIAR PACIENTE:",
          erroCriacaoPaciente
        );
        return NextResponse.json(
          { error: "Não foi possível criar o cadastro do paciente." },
          { status: 500 }
        );
      }

      paciente = novoPaciente;
    }

    const pacienteId = paciente.id;
    const nomePaciente = paciente.nome || nomeInformado;
    const emailAgendamento = paciente.email || emailPaciente;
    const telefonePaciente = paciente.telefone || null;

    /*
     * 6. Cria o agendamento vinculado ao paciente.
     *
     * O valor é salvo junto com o agendamento.
     * Para os pacotes, cada sessão/agendamento
     * recebe R$ 210,00.
     */
    const {
      data: novoAgendamento,
      error: erroAgendamento,
    } = await supabase
      .from("agendamentos")
      .insert({
        paciente_id: pacienteId,
        nome: nomePaciente,
        email: emailAgendamento,
        telefone: telefonePaciente,
        servico,
        valor,
        data,
        horario,
        payment_status: "pendente",
      })
      .select("id, paciente_id, valor")
      .single();

    if (erroAgendamento || !novoAgendamento) {
      console.error(
        "ERRO AO CRIAR AGENDAMENTO:",
        erroAgendamento
      );

      if (erroAgendamento?.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Esse horário já foi ocupado. Escolha outro.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Não foi possível salvar o agendamento.",
        },
        { status: 500 }
      );
    }

    const resposta = NextResponse.json({
      ok: true,
      agendamento_id: novoAgendamento.id,
      valor: novoAgendamento.valor,
    });

    if (!authenticatedPatient && Number(novoAgendamento.valor) > 0) {
      resposta.cookies.set(
        `guest_payment_${novoAgendamento.id}`,
        createGuestPaymentToken(
          novoAgendamento.id,
          serviceRoleKey
        ),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/api/pagamento",
        }
      );
    }

    return resposta;
  } catch (error) {
    console.error(
      "ERRO INTERNO AO SALVAR AGENDAMENTO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao salvar o agendamento.",
      },
      { status: 500 }
    );
  }
}
