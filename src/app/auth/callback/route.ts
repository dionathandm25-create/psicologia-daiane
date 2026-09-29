import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=login`);
  }

  const supabase = await createServerClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "ERRO AO CRIAR SESSÃO DO GOOGLE:",
      error
    );

    return NextResponse.redirect(
      `${origin}/login?erro=login`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase();

  if (!user || !email) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      `${origin}/login?erro=email`
    );
  }

  if (email === EMAIL_ADMIN.toLowerCase()) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  try {
    const supabaseAdmin = criarAdminClient();

    const {
      data: pacienteExistente,
      error: erroBuscaPaciente,
    } = await supabaseAdmin
      .from("pacientes")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (erroBuscaPaciente) {
      console.error(
        "ERRO AO BUSCAR PACIENTE NO LOGIN:",
        erroBuscaPaciente
      );

      return NextResponse.redirect(
        `${origin}/login?erro=paciente`
      );
    }

    const emailVerificado =
      user.email_confirmed_at !== null;

    const ultimoAcesso = new Date().toISOString();

    if (pacienteExistente) {
      const {
        error: erroVinculo,
      } = await supabaseAdmin
        .from("pacientes")
        .update({
          usuario_id: user.id,
          email_verificado: emailVerificado,
          ultimo_acesso: ultimoAcesso,
        })
        .eq("id", pacienteExistente.id);

      if (erroVinculo) {
        console.error(
          "ERRO AO VINCULAR USUÁRIO AO PACIENTE:",
          erroVinculo
        );

        return NextResponse.redirect(
          `${origin}/login?erro=vinculo`
        );
      }
    } else {
      const nomeGoogle =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0];

      const {
        error: erroCriacao,
      } = await supabaseAdmin
        .from("pacientes")
        .insert({
          nome: String(nomeGoogle).trim(),
          email,
          usuario_id: user.id,
          status: "ativo",
          email_verificado: emailVerificado,
          ultimo_acesso: ultimoAcesso,
        });

      if (erroCriacao) {
        console.error(
          "ERRO AO CRIAR PACIENTE PELO LOGIN:",
          erroCriacao
        );

        return NextResponse.redirect(
          `${origin}/login?erro=paciente`
        );
      }
    }

    return NextResponse.redirect(`${origin}/paciente`);
  } catch (error) {
    console.error(
      "ERRO AO PROCESSAR LOGIN DO PACIENTE:",
      error
    );

    return NextResponse.redirect(
      `${origin}/login?erro=paciente`
    );
  }
}
