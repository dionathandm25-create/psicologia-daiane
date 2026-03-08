import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { agendamentoId, servico } = await req.json();

  const accessToken = process.env.MP_ACCESS_TOKEN;

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: servico,
          quantity: 1,
          currency_id: "BRL",
          unit_price: 280
        }
      ],
      external_reference: agendamentoId,
      back_urls: {
        success: "https://psicologia-daiane.vercel.app/confirmacao",
        failure: "https://psicologia-daiane.vercel.app/agendar",
        pending: "https://psicologia-daiane.vercel.app/agendar"
      },
      auto_return: "approved"
    })
  });

  const data = await response.json();

  return NextResponse.json({
    init_point: data.init_point
  });
}
