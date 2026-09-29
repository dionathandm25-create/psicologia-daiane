import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase no servidor não encontrada."
    );
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verificarAdmin() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !user ||
    user.email?.toLowerCase() !== EMAIL_ADMIN
  ) {
    return false;
  }

  return true;
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const pacienteId = Number(id);

    if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
      return NextResponse.json(
        {
          error: "ID do paciente inválido.",
        },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const {
      data: paciente,
      error: pacienteError,
    } = await supabase
      .from("pacientes")
      .select(
        `
          id,
          created_at,
          nome,
          nome_social,
          data_nascimento,
          sexo,
          email,
          email_verificado,
          telefone,
          whatsapp,
          cpf,
          foto_url,
          status,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          tipo_documento,
          documento_numero,
          identidade_verificada,
          identidade_verificada_em,
          usuario_id,
          ultimo_acesso
        `
      )
      .eq("id", pacienteId)
      .single();

    if (pacienteError || !paciente) {
      console.error(
        "ERRO AO BUSCAR PACIENTE:",
        pacienteError
      );

      return NextResponse.json(
        {
          error: "Paciente não encontrado.",
        },
        { status: 404 }
      );
    }

    const {
      data: agendamentos,
      error: agendamentosError,
    } = await supabase
      .from("agendamentos")
      .select(
        `
          id,
          created_at,
          nome,
          email,
          telefone,
          servico,
          data,
          horario,
          payment_status,
          payment_id,
          preference_id,
          metodo_pagamento,
          atendimento_status,
          atendimento_inicio,
          atendimento_fim,
          paciente_id
        `
      )
      .eq("paciente_id", pacienteId)
      .order("data", {
        ascending: false,
      })
      .order("horario", {
        ascending: false,
      });

    if (agendamentosError) {
      console.error(
        "ERRO AO BUSCAR HISTÓRICO DO PACIENTE:",
        agendamentosError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar o histórico do paciente.",
        },
        { status: 500 }
      );
    }

    const atendimentoIds = (agendamentos || []).map(
      (agendamento) => agendamento.id
    );

    let registros: {
      id: number;
      created_at: string;
      atendimento_id: number;
      tipo: string;
      conteudo: string;
    }[] = [];

    if (atendimentoIds.length > 0) {
      const {
        data: registrosData,
        error: registrosError,
      } = await supabase
        .from("atendimento_registros")
        .select(
          `
            id,
            created_at,
            atendimento_id,
            tipo,
            conteudo
          `
        )
        .in("atendimento_id", atendimentoIds)
        .order("created_at", {
          ascending: true,
        });

      if (registrosError) {
        console.error(
          "ERRO AO BUSCAR REGISTROS DO PACIENTE:",
          registrosError
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível carregar os registros do prontuário.",
          },
          { status: 500 }
        );
      }

      registros = registrosData || [];
    }

    const historico = (agendamentos || []).map(
      (agendamento) => ({
        ...agendamento,

        registros: registros.filter(
          (registro) =>
            registro.atendimento_id ===
            agendamento.id
        ),
      })
    );

    return NextResponse.json({
      paciente,
      historico,
    });
  } catch (error) {
    console.error(
      "ERRO GET HISTÓRICO DO PACIENTE:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar o histórico do paciente.",
      },
      { status: 500 }
    );
  }
}
