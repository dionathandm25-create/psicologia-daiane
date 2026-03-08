import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const topic = body.type || body.topic;
    const paymentId = body.data?.id || body.resource?.split("/")?.pop();

    if (!paymentId || topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN!;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payment = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return NextResponse.json({ error: "Erro ao consultar pagamento." }, { status: 500 });
    }

    const agendamentoId = payment.external_reference;
    const status = payment.status;
    const metodo = payment.payment_method_id || null;

    if (agendamentoId) {
      await supabase
        .from("agendamentos")
        .update({
          payment_status: status,
          payment_id: String(payment.id),
          metodo_pagamento: metodo,
        })
        .eq("id", Number(agendamentoId));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro no webhook." }, { status: 500 });
  }
}
