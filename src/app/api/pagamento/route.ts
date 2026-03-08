import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { agendamentoId, servico } = await req.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!accessToken) {
      return NextResponse.json(
        { error: "MP_ACCESS_TOKEN não configurado." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRole);

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
              title: servico || "Consulta psicológica",
              quantity: 1,
              currency_id: "BRL",
              unit_price: 280,
            },
          ],
          external_reference: String(agendamentoId),
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

    await supabase
      .from("agendamentos")
      .update({
        preference_id: data.id,
        payment_status: "pendente",
      })
      .eq("id", agendamentoId);

    return NextResponse.json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar pagamento." },
      { status: 500 }
    );
  }
}
