import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

const TIPOS_REGISTRO = [
  "anotacao",
  "informacao_extra",
  "observacao",
  "evolucao",
  "orientacao",
  "outro",
] as const;

type TipoRegistro = (typeof TIPOS_REGISTRO)[number];

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "ConfiguraÃ§Ã£o do Supabase no servidor nÃ£o encontrada."
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

function tipoValido(tipo: unknown): tipo is TipoRegistro {
  return (
    typeof tipo === "string" &&
    TIPOS_REGISTRO.includes(tipo as TipoRegistro)
  );
}

export async function GET(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "NÃ£o autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const atendimentoId = Number(
      searchParams.get("atendimento_id")
    );

    if (
      !Number.isInteger(atendimentoId) ||
      atendimentoId <= 0
    ) {
      return NextResponse.json(
        { error: "ID do atendimento invÃ¡lido." },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { data, error } = await supabase
      .from("atendimento_registros")
      .select(
        "id, created_at, atendimento_id, tipo, conteudo"
      )
      .eq("atendimento_id", atendimentoId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "ERRO AO BUSCAR REGISTROS:",
        error
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel carregar os registros.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registros: data || [],
    });
  } catch (error) {
    console.error(
      "ERRO GET REGISTROS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar os registros.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "NÃ£o autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const atendimentoId = Number(
      body.atendimento_id
    );

    const tipo = body.tipo;

    const conteudo =
      typeof body.conteudo === "string"
        ? body.conteudo.trim()
        : "";

    if (
      !Number.isInteger(atendimentoId) ||
      atendimentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do atendimento invÃ¡lido.",
        },
        { status: 400 }
      );
    }

    if (!tipoValido(tipo)) {
      return NextResponse.json(
        {
          error:
            "Tipo de registro invÃ¡lido.",
        },
        { status: 400 }
      );
    }

    if (!conteudo) {
      return NextResponse.json(
        {
          error:
            "O conteÃºdo do registro nÃ£o pode ficar vazio.",
        },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const {
      data: agendamento,
      error: agendamentoError,
    } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("id", atendimentoId)
      .single();

    if (
      agendamentoError ||
      !agendamento
    ) {
      return NextResponse.json(
        {
          error:
            "Atendimento nÃ£o encontrado.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("atendimento_registros")
      .insert({
        atendimento_id: atendimentoId,
        tipo,
        conteudo,
      })
      .select(
        "id, created_at, atendimento_id, tipo, conteudo"
      )
      .single();

    if (error) {
      console.error(
        "ERRO AO SALVAR REGISTRO:",
        error
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel salvar o registro.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { registro: data },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ERRO POST REGISTROS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao salvar o registro.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "NÃ£o autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const registroId = Number(body.id);

    const conteudo =
      typeof body.conteudo === "string"
        ? body.conteudo.trim()
        : "";

    if (
      !Number.isInteger(registroId) ||
      registroId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do registro invÃ¡lido.",
        },
        { status: 400 }
      );
    }

    if (!conteudo) {
      return NextResponse.json(
        {
          error:
            "O conteÃºdo do registro nÃ£o pode ficar vazio.",
        },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { data, error } = await supabase
      .from("atendimento_registros")
      .update({
        conteudo,
      })
      .eq("id", registroId)
      .select(
        "id, created_at, atendimento_id, tipo, conteudo"
      )
      .single();

    if (error) {
      console.error(
        "ERRO AO EDITAR REGISTRO:",
        error
      );

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            error:
              "Registro nÃ£o encontrado.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel editar o registro.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registro: data,
    });
  } catch (error) {
    console.error(
      "ERRO PUT REGISTROS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao editar o registro.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "NÃ£o autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const registroId = Number(body.id);

    if (
      !Number.isInteger(registroId) ||
      registroId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do registro invÃ¡lido.",
        },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { error } = await supabase
      .from("atendimento_registros")
      .delete()
      .eq("id", registroId);

    if (error) {
      console.error(
        "ERRO AO EXCLUIR REGISTRO:",
        error
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel excluir o registro.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
    });
  } catch (error) {
    console.error(
      "ERRO DELETE REGISTROS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao excluir o registro.",
      },
      { status: 500 }
    );
  }
}

