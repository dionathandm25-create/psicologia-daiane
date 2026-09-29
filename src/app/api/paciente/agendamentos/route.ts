import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: erroUsuario,
    } = await supabase.auth.getUser();

    if (erroUsuario || !user) {
      return NextResponse.json(
        {
          error: "Não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin = criarAdminClient();

    const {
      data: paciente,
      error: erroPaciente,
    } = await supabaseAdmin
      .from("pacientes")
      .select("id")
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (erroPaciente) {
      console.error(
        "ERRO AO BUSCAR PACIENTE AUTENTICADO:",
        erroPaciente
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível identificar seu cadastro de paciente.",
        },
        {
          status: 500,
        }
      );
    }

    if (!paciente) {
      return NextResponse.json(
        {
          error:
            "Seu usuário ainda não está vinculado a um cadastro de paciente.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: agendamentos,
      error: erroAgendamentos,
    } = await supabaseAdmin
      .from("agendamentos")
      .select(
        `
          id,
          nome,
          email,
          telefone,
          servico,
          data,
          horario,
          created_at,
          payment_status,
          atendimento_status,
          paciente_id
        `
      )
      .eq("paciente_id", paciente.id)
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (erroAgendamentos) {
      console.error(
        "ERRO AO BUSCAR AGENDAMENTOS DO PACIENTE:",
        erroAgendamentos
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar seus agendamentos.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      agendamentos: agendamentos || [],
    });
  } catch (error) {
    console.error(
      "ERRO NA API DE AGENDAMENTOS DO PACIENTE:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar seus agendamentos.",
      },
      {
        status: 500,
      }
    );
  }
}
