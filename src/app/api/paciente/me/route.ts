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
      .select(
        `
          id,
          nome,
          nome_social,
          email,
          telefone,
          whatsapp,
          foto_url
        `
      )
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
            "Não foi possível carregar seus dados de paciente.",
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

    return NextResponse.json({
      paciente,
    });
  } catch (error) {
    console.error(
      "ERRO NA API DO PACIENTE:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar os dados do paciente.",
      },
      {
        status: 500,
      }
    );
  }
}
