import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=login`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("ERRO AO CRIAR SESSÃO DO GOOGLE:", error);

    return NextResponse.redirect(`${origin}/login?erro=login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();

  if (!email) {
    await supabase.auth.signOut();

    return NextResponse.redirect(`${origin}/login?erro=email`);
  }

  if (email === EMAIL_ADMIN.toLowerCase()) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
