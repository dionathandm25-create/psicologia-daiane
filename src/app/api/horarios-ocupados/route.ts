import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const data = request.nextUrl.searchParams.get("data");

    if (!data) {
      return NextResponse.json({ horarios: [] });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rows, error } = await supabase
      .from("agendamentos")
      .select("horario")
      .eq("data", data);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar horários ocupados." },
        { status: 500 }
      );
    }

    const horarios = (rows ?? []).map((item) => item.horario);

    return NextResponse.json({ horarios });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao buscar horários." },
      { status: 500 }
    );
  }
}
