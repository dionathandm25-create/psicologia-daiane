import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

async function verificarAdmin() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

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

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "As variáveis do Supabase não estão configuradas no servidor."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const acao = body.acao;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !["iniciar", "finalizar"].includes(acao)
    ) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: agendamento, error: buscarError } =
      await supabase
        .from("agendamentos")
        .select("*")
        .eq("id", id)
        .single();

    if (buscarError || !agendamento) {
      console.error(
        "ERRO AO BUSCAR AGENDAMENTO:",
        buscarError
      );

      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    if (acao === "iniciar") {
      if (agendamento.atendimento_status === "finalizado") {
        return NextResponse.json(
          { error: "Este atendimento já foi finalizado." },
          { status: 409 }
        );
      }

      const inicio = new Date().toISOString();

      const { data, error } = await supabase
        .from("agendamentos")
        .update({
          atendimento_status: "em_andamento",
          atendimento_inicio: inicio,
          atendimento_fim: null,
        })
        .eq("id", id)
        .select(
          "id, nome, email, telefone, servico, data, horario, payment_status, atendimento_status, atendimento_inicio, atendimento_fim"
        )
        .single();

      if (error) {
        console.error(
          "ERRO AO INICIAR ATENDIMENTO:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível iniciar o atendimento.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        agendamento: data,
      });
    }

    if (agendamento.atendimento_status !== "em_andamento") {
      return NextResponse.json(
        {
          error:
            "Este atendimento não está em andamento.",
        },
        { status: 409 }
      );
    }

    const fim = new Date().toISOString();

    const { data, error } = await supabase
      .from("agendamentos")
      .update({
        atendimento_status: "finalizado",
        atendimento_fim: fim,
      })
      .eq("id", id)
      .select(
        "id, nome, email, telefone, servico, data, horario, payment_status, atendimento_status, atendimento_inicio, atendimento_fim"
      )
      .single();

    if (error) {
      console.error(
        "ERRO AO FINALIZAR ATENDIMENTO:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível finalizar o atendimento.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agendamento: data,
    });
  } catch (error) {
    console.error(
      "ERRO NA API DE ATENDIMENTO:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno no servidor.",
      },
      { status: 500 }
    );
  }
}
