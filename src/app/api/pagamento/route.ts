import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { agendamentoId } = await req.json();

    if (!agendamentoId) {
      return NextResponse.json(
        { error: "Agendamento não informado." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken || !supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: "Configuração do servidor não encontrada." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRole,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * Busca o agendamento diretamente no banco.
     * O valor utilizado no pagamento vem do servidor,
     * e não do navegador.
     */
    const {
      data: agendamento,
      error: erroAgendamento,
    } = await supabase
      .from("agendamentos")
      .select("id, servico, valor")
      .eq("id", agendamentoId)
      .single();

    if (erroAgendamento || !agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    const valor = agendamento.valor;

    if (valor === null || valor === undefined || Number(valor) <= 0) {
      return NextResponse.json(
        {
          error:
            "Este serviço está sem valor definido para pagamento online. Entre em contato para consultar.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: agendamento.servico || "Consulta psicológica",
              quantity: 1,
              currency_id: "BRL",
              unit_price: Number(valor),
            },
          ],
          payment_methods: {
            excluded_payment_types: [],
            excluded_payment_methods: [],
            installments: 1,
          },
          external_reference: String(agendamento.id),
          back_urls: {
            success: "https://psicologia-daiane.vercel.app/confirmacao",
            failure: "https://psicologia-daiane.vercel.app/pagamento",
            pending: "https://psicologia-daiane.vercel.app/pagamento",
          },
          auto_return: "approved",
          notification_url:
            "https://psicologia-daiane.vercel.app/api/mercadopago/webhook",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Erro ao criar preferência." },
        { status: 500 }
      );
    }

    const { error: erroAtualizacao } = await supabase
      .from("agendamentos")
      .update({
        preference_id: data.id,
        payment_status: "pendente",
      })
      .eq("id", agendamento.id);

    if (erroAtualizacao) {
      console.error(
        "ERRO AO ATUALIZAR AGENDAMENTO:",
        erroAtualizacao
      );

      return NextResponse.json(
        { error: "Não foi possível atualizar o pagamento." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (error) {
    console.error(
      "ERRO INTERNO AO CRIAR PAGAMENTO:",
      error
    );

    return NextResponse.json(
      { error: "Erro interno ao criar pagamento." },
      { status: 500 }
    );
  }
}
