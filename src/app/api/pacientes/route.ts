import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "contatocomercial.dionathandev@gmail.com";

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

export async function GET(request: Request) {
  try {
    // ============================================
    // 1. VERIFICAR ADMINISTRADOR
    // ============================================

    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        { status: 401 }
      );
    }

    // ============================================
    // 2. LER BUSCA
    // ============================================

    const { searchParams } = new URL(request.url);

    const busca = (
      searchParams.get("busca") || ""
    )
      .trim()
      .toLowerCase();

    // ============================================
    // 3. CRIAR CLIENTE ADMINISTRATIVO
    // ============================================

    const supabase = criarAdminClient();

    // ============================================
    // 4. BUSCAR PACIENTES
    // ============================================

    let query = supabase
      .from("pacientes")
      .select(
        `
          id,
          created_at,
          nome,
          nome_social,
          email,
          telefone,
          whatsapp,
          cpf,
          foto_url,
          status
        `
      )
      .order("nome", {
        ascending: true,
      });

    if (busca) {
      query = query.or(
        `nome.ilike.%${busca}%,email.ilike.%${busca}%,cpf.ilike.%${busca}%`
      );
    }

    const {
      data: pacientes,
      error: pacientesError,
    } = await query;

    if (pacientesError) {
      console.error(
        "ERRO AO BUSCAR PACIENTES:",
        pacientesError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os pacientes.",
        },
        { status: 500 }
      );
    }

    // ============================================
    // 5. BUSCAR AGENDAMENTOS DOS PACIENTES
    // ============================================

    const pacienteIds = (pacientes || []).map(
      (paciente) => paciente.id
    );

    let quantidadeConsultas: Record<
      number,
      number
    > = {};

    let ultimoAtendimento: Record<
      number,
      string
    > = {};

    if (pacienteIds.length > 0) {
      const {
        data: agendamentos,
        error: agendamentosError,
      } = await supabase
        .from("agendamentos")
        .select(
          "id, paciente_id, data, horario, atendimento_status"
        )
        .in("paciente_id", pacienteIds)
        .order("data", {
          ascending: false,
        })
        .order("horario", {
          ascending: false,
        });

      if (agendamentosError) {
        console.error(
          "ERRO AO BUSCAR AGENDAMENTOS DOS PACIENTES:",
          agendamentosError
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível carregar o histórico dos pacientes.",
          },
          { status: 500 }
        );
      }

      for (const agendamento of agendamentos || []) {
        const pacienteId =
          agendamento.paciente_id;

        quantidadeConsultas[pacienteId] =
          (quantidadeConsultas[pacienteId] || 0) + 1;

        if (!ultimoAtendimento[pacienteId]) {
          ultimoAtendimento[pacienteId] =
            agendamento.data;
        }
      }
    }

    // ============================================
    // 6. MONTAR RESPOSTA
    // ============================================

    const resultado = (pacientes || []).map(
      (paciente) => ({
        ...paciente,
        quantidade_consultas:
          quantidadeConsultas[paciente.id] || 0,
        ultimo_atendimento:
          ultimoAtendimento[paciente.id] || null,
      })
    );

    return NextResponse.json({
      pacientes: resultado,
    });
  } catch (error) {
    console.error(
      "ERRO GET PACIENTES:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar os pacientes.",
      },
      { status: 500 }
    );
  }
}
