import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "contatocomercial.dionathandev@gmail.com";

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configuração do Supabase no servidor não encontrada.");
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verificarAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.email?.toLowerCase() !== EMAIL_ADMIN) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const atendimentoId = Number(searchParams.get("atendimento_id"));

    if (!Number.isInteger(atendimentoId) || atendimentoId <= 0) {
      return NextResponse.json(
        { error: "ID do atendimento inválido." },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { data, error } = await supabase
      .from("atendimento_registros")
      .select("id, created_at, atendimento_id, tipo, conteudo")
      .eq("atendimento_id", atendimentoId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("ERRO AO BUSCAR REGISTROS:", error);
      return NextResponse.json(
        { error: "Não foi possível carregar os registros." },
        { status: 500 }
      );
    }

    return NextResponse.json({ registros: data || [] });
  } catch (error) {
    console.error("ERRO GET REGISTROS:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar os registros." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const atendimentoId = Number(body.atendimento_id);
    const tipo = body.tipo;
    const conteudo = typeof body.conteudo === "string" ? body.conteudo.trim() : "";

    if (!Number.isInteger(atendimentoId) || atendimentoId <= 0) {
      return NextResponse.json(
        { error: "ID do atendimento inválido." },
        { status: 400 }
      );
    }

    if (tipo !== "anotacao" && tipo !== "informacao_extra") {
      return NextResponse.json(
        { error: "Tipo de registro inválido." },
        { status: 400 }
      );
    }

    if (!conteudo) {
      return NextResponse.json(
        { error: "O conteúdo do registro não pode ficar vazio." },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("id", atendimentoId)
      .single();

    if (agendamentoError || !agendamento) {
      return NextResponse.json(
        { error: "Atendimento não encontrado." },
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
      .select("id, created_at, atendimento_id, tipo, conteudo")
      .single();

    if (error) {
      console.error("ERRO AO SALVAR REGISTRO:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar o registro." },
        { status: 500 }
      );
    }

    return NextResponse.json({ registro: data }, { status: 201 });
  } catch (error) {
    console.error("ERRO POST REGISTROS:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar o registro." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const registroId = Number(body.id);

    if (!Number.isInteger(registroId) || registroId <= 0) {
      return NextResponse.json(
        { error: "ID do registro inválido." },
        { status: 400 }
      );
    }

    const supabase = criarAdminClient();

    const { error } = await supabase
      .from("atendimento_registros")
      .delete()
      .eq("id", registroId);

    if (error) {
      console.error("ERRO AO EXCLUIR REGISTRO:", error);
      return NextResponse.json(
        { error: "Não foi possível excluir o registro." },
        { status: 500 }
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("ERRO DELETE REGISTROS:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir o registro." },
      { status: 500 }
    );
  }
}
