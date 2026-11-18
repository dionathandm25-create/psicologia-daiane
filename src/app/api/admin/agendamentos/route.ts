import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth/redirects";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configuração do Supabase no servidor não encontrada.");
  }

  return createSupabaseAdminClient(url, serviceRoleKey, {
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

  return !error && isAdminUser(user);
}

export async function GET(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = criarAdminClient();
    const idParam = new URL(request.url).searchParams.get("id");

    if (idParam !== null) {
      if (!/^[1-9]\d*$/.test(idParam)) {
        return NextResponse.json(
          { error: "ID do agendamento inválido." },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      const id = Number(idParam);
      if (!Number.isSafeInteger(id)) {
        return NextResponse.json(
          { error: "ID do agendamento inválido." },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      const { data: agendamento, error } = await supabase
        .from("agendamentos")
        .select(
          "id, nome, email, telefone, servico, data, horario, payment_status, atendimento_status, atendimento_inicio, atendimento_fim"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar atendimento administrativo:", error);
        return NextResponse.json(
          { error: "Não foi possível carregar o atendimento." },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      if (!agendamento) {
        return NextResponse.json(
          { error: "Atendimento não encontrado." },
          { status: 404, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        { agendamento },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .select(
        "id, nome, email, telefone, servico, data, horario, created_at, payment_status, atendimento_status"
      )
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao carregar agendamentos administrativos:", error);
      return NextResponse.json(
        { error: "Não foi possível carregar os agendamentos." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { agendamentos: data || [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Falha na API administrativa de agendamentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar os agendamentos." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    let body: { id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da solicitação inválido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID do agendamento inválido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = criarAdminClient();
    const { data, error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Erro ao cancelar agendamento administrativo:", error);
      return NextResponse.json(
        { error: "Não foi possível cancelar a consulta." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { sucesso: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Falha na API de cancelamento administrativo:", error);
    return NextResponse.json(
      { error: "Erro interno ao cancelar a consulta." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
