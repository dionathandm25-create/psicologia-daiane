import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json(
        {
          error: "A data informada é inválida.",
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
    const nomePaciente = String(nome).trim();

    const emailPaciente = String(email)
      .trim()
      .toLowerCase();

    const telefonePaciente =
      typeof telefone === "string"
        ? telefone.trim()
        : "";

    const cpfPaciente =
      typeof cpf === "string"
        ? cpf.trim()
        : "";

    /*
     * 3. Procura paciente existente pelo e-mail.
     */
    const {
      data: pacienteExistente,
      error: erroBuscaPaciente,
    } = await supabase
      .from("pacientes")
      .select("id")
      .eq("email", emailPaciente)
      .limit(1)
      .maybeSingle();

    if (erroBuscaPaciente) {
      console.error(
        "ERRO AO PROCURAR PACIENTE:",
        erroBuscaPaciente
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o cadastro do paciente.",
        },
        { status: 500 }
      );
    }

    let pacienteId: number;

    /*
     * 4. Se o paciente já existe, atualiza
     * os dados básicos.
     */
    if (pacienteExistente) {
      pacienteId = pacienteExistente.id;

      const {
        error: erroAtualizacaoPaciente,
      } = await supabase
        .from("pacientes")
        .update({
          nome: nomePaciente,
          telefone:
            telefonePaciente || null,
          cpf: cpfPaciente || null,
          email: emailPaciente,
        })
        .eq("id", pacienteId);

      if (erroAtualizacaoPaciente) {
        console.error(
          "ERRO AO ATUALIZAR PACIENTE:",
          erroAtualizacaoPaciente
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível atualizar o cadastro do paciente.",
          },
          { status: 500 }
        );
      }

      console.log(
        "PACIENTE EXISTENTE ENCONTRADO:",
        pacienteId
      );
    } else {
      /*
       * 5. Se não existe, cria um novo paciente.
       */
      const {
        data: novoPaciente,
        error: erroCriacaoPaciente,
      } = await supabase
        .from("pacientes")
        .insert({
          nome: nomePaciente,
          email: emailPaciente,
          telefone:
            telefonePaciente || null,
          cpf: cpfPaciente || null,
          status: "ativo",
        })
        .select("id")
        .single();

      if (erroCriacaoPaciente || !novoPaciente) {
        console.error(
          "ERRO AO CRIAR PACIENTE:",
          erroCriacaoPaciente
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível criar o cadastro do paciente.",
          },
          { status: 500 }
        );
      }

      pacienteId = novoPaciente.id;

      console.log(
        "NOVO PACIENTE CRIADO:",
        pacienteId
      );
    }

    /*
     * 6. Cria o agendamento vinculado ao paciente.
     */
    const {
      data: novoAgendamento,
      error: erroAgendamento,
    } = await supabase
      .from("agendamentos")
      .insert({
        paciente_id: pacienteId,
        nome: nomePaciente,
        email: emailPaciente,
        telefone:
          telefonePaciente || null,
        servico,
        data,
        horario,
        payment_status: "pendente",
      })
      .select("id, paciente_id")
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

    console.log(
      "AGENDAMENTO CRIADO:",
      novoAgendamento
    );

    return NextResponse.json({
      ok: true,
      paciente_id: pacienteId,
      agendamento_id: novoAgendamento.id,
    });
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
