import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      email,
      telefone,
      servico,
      data,
      horario,
    } = body;

    if (!nome || !email || !servico || !data || !horario) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existente } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("data", data)
      .eq("horario", horario)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: "Esse horário já foi ocupado. Escolha outro." },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("agendamentos").insert({
      nome,
      email,
      telefone,
      servico,
      data,
      horario,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Esse horário já foi ocupado. Escolha outro." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Não foi possível salvar o agendamento." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao salvar o agendamento." },
      { status: 500 }
    );
  }
}
