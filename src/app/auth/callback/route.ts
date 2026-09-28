import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("ERRO AO CRIAR SESSÃO DO GOOGLE:", error);

      return NextResponse.redirect(
        `${origin}/admin?erro=login`
      );
    }

    console.log("LOGIN GOOGLE REALIZADO COM SUCESSO");
  }

  return NextResponse.redirect(`${origin}/admin`);
}
