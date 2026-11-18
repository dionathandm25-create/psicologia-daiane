import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function validarAssinatura(
  assinatura: string | null,
  requestId: string | null,
  dataId: string,
  secret: string
) {
  if (!assinatura || !requestId) {
    return false;
  }

  const campos = new Map(
    assinatura.split(",").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, valueParts.join("=")];
    })
  );
  const timestamp = campos.get("ts");
  const assinaturaInformada = campos.get("v1");

  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !assinaturaInformada ||
    !/^[a-f\d]{64}$/i.test(assinaturaInformada)
  ) {
    return false;
  }

  const idManifesto = /^\d+$/.test(dataId) ? dataId : dataId.toLowerCase();
  const manifesto = `id:${idManifesto};request-id:${requestId};ts:${timestamp};`;
  const assinaturaEsperada = createHmac("sha256", secret)
    .update(manifesto)
    .digest();
  const assinaturaRecebida = Buffer.from(assinaturaInformada, "hex");

  return (
    assinaturaRecebida.length === assinaturaEsperada.length &&
    timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
  );
}

function toCents(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100)
    : null;
}

const ESTADOS_PAGAMENTO_VALIDOS = new Set([
  "approved",
  "pending",
  "in_process",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
  "in_mediation",
  "authorized",
]);
const ESTADOS_QUE_REVERTEM_APROVACAO = new Set([
  "refunded",
  "charged_back",
  "in_mediation",
]);
const ESTADOS_TERMINAIS = new Set([
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
]);

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const url = new URL(request.url);
    const queryDataId = url.searchParams.get("data.id");
    const bodyDataId =
      isRecord(body) && isRecord(body.data) ? body.data.id : undefined;
    const dataId = String(queryDataId ?? bodyDataId ?? "");
    const requestId = request.headers.get("x-request-id");
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("SEGREDO DE ASSINATURA DO WEBHOOK NÃO CONFIGURADO.");
      return NextResponse.json(
        { error: "Webhook temporariamente indisponível." },
        { status: 503 }
      );
    }

    if (
      !/^\d+$/.test(dataId) ||
      !validarAssinatura(
        request.headers.get("x-signature"),
        requestId,
        dataId,
        webhookSecret
      )
    ) {
      return NextResponse.json(
        { error: "Notificação não autenticada." },
        { status: 401 }
      );
    }

    const topic =
      (isRecord(body) && (body.type || body.topic)) ||
      url.searchParams.get("type");
    if (topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const bodyPaymentId =
      isRecord(body) && isRecord(body.data) ? body.data.id : undefined;
    const resource =
      isRecord(body) && typeof body.resource === "string"
        ? body.resource
        : null;
    const paymentId = String(
      bodyPaymentId ?? resource?.split("/").pop() ?? dataId
    );

    if (!/^\d+$/.test(paymentId) || paymentId !== dataId) {
      return NextResponse.json(
        { error: "Identificador de pagamento inválido." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      console.error("CONFIGURAÇÃO DO WEBHOOK NÃO COMPLETA.");
      return NextResponse.json(
        { error: "Webhook temporariamente indisponível." },
        { status: 503 }
      );
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );
    const paymentBody: unknown = await paymentResponse.json();

    if (!paymentResponse.ok || !isRecord(paymentBody)) {
      console.error("FALHA AO CONSULTAR PAGAMENTO NO MERCADO PAGO.");
      return NextResponse.json(
        { error: "Não foi possível confirmar o pagamento." },
        { status: 502 }
      );
    }

    if (
      String(paymentBody.id) !== paymentId ||
      typeof paymentBody.status !== "string" ||
      !ESTADOS_PAGAMENTO_VALIDOS.has(paymentBody.status)
    ) {
      return NextResponse.json(
        { error: "Dados de pagamento inválidos." },
        { status: 422 }
      );
    }

    const appointmentIdText = paymentBody.external_reference;
    if (
      typeof appointmentIdText !== "string" ||
      !/^\d+$/.test(appointmentIdText)
    ) {
      return NextResponse.json(
        { error: "Referência do agendamento inválida." },
        { status: 422 }
      );
    }

    const appointmentId = Number(appointmentIdText);
    const transactionCents = toCents(paymentBody.transaction_amount);
    if (
      !Number.isSafeInteger(appointmentId) ||
      appointmentId <= 0 ||
      paymentBody.currency_id !== "BRL" ||
      transactionCents === null
    ) {
      return NextResponse.json(
        { error: "Dados de pagamento inválidos." },
        { status: 422 }
      );
    }

    const metadata = isRecord(paymentBody.metadata)
      ? paymentBody.metadata
      : null;
    if (
      metadata?.appointment_id !== undefined &&
      String(metadata.appointment_id) !== appointmentIdText
    ) {
      return NextResponse.json(
        { error: "Metadados do pagamento não correspondem ao agendamento." },
        { status: 422 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: agendamento,
      error: erroAgendamento,
    } = await supabase
      .from("agendamentos")
      .select("id, valor, payment_id, payment_status")
      .eq("id", appointmentId)
      .maybeSingle();

    if (erroAgendamento) {
      console.error("ERRO AO BUSCAR AGENDAMENTO DO PAGAMENTO:", erroAgendamento);
      return NextResponse.json(
        { error: "Não foi possível verificar o agendamento." },
        { status: 500 }
      );
    }

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento associado ao pagamento não encontrado." },
        { status: 404 }
      );
    }

    if (toCents(agendamento.valor) !== transactionCents) {
      console.error("VALOR DO PAGAMENTO DIVERGE DO AGENDAMENTO:", appointmentId);
      return NextResponse.json(
        { error: "O valor do pagamento não corresponde ao agendamento." },
        { status: 422 }
      );
    }

    const status = paymentBody.status;
    const statusAtual =
      typeof agendamento.payment_status === "string"
        ? agendamento.payment_status.toLowerCase()
        : "";
    const pagamentoAtualId = agendamento.payment_id
      ? String(agendamento.payment_id)
      : null;
    const mesmoPagamento = pagamentoAtualId === paymentId;
    const podeSubstituirPagamentoAnterior =
      pagamentoAtualId !== null &&
      !mesmoPagamento &&
      ["rejected", "cancelled"].includes(statusAtual);

    if (
      pagamentoAtualId !== null &&
      !mesmoPagamento &&
      !podeSubstituirPagamentoAnterior
    ) {
      console.error("PAGAMENTO DIFERENTE JÁ VINCULADO:", appointmentId);
      return NextResponse.json(
        { error: "Já existe outro pagamento vinculado ao agendamento." },
        { status: 409 }
      );
    }

    if (
      mesmoPagamento &&
      statusAtual === status
    ) {
      return NextResponse.json({ ok: true });
    }

    if (
      mesmoPagamento &&
      ESTADOS_TERMINAIS.has(statusAtual) &&
      statusAtual !== status
    ) {
      return NextResponse.json({ ok: true });
    }

    if (
      statusAtual === "approved" &&
      !ESTADOS_QUE_REVERTEM_APROVACAO.has(status)
    ) {
      return NextResponse.json({ ok: true });
    }

    let updateQuery = supabase
      .from("agendamentos")
      .update({
        payment_status: status,
        payment_id: paymentId,
        metodo_pagamento:
          typeof paymentBody.payment_method_id === "string"
            ? paymentBody.payment_method_id
            : null,
      })
      .eq("id", appointmentId);

    if (podeSubstituirPagamentoAnterior && pagamentoAtualId) {
      updateQuery = updateQuery
        .eq("payment_id", pagamentoAtualId)
        .eq("payment_status", agendamento.payment_status);
    } else {
      updateQuery = updateQuery.or(
        `payment_id.is.null,payment_id.eq.${paymentId}`
      );
    }

    if (agendamento.payment_status === null) {
      updateQuery = updateQuery.is("payment_status", null);
    } else {
      updateQuery = updateQuery.eq(
        "payment_status",
        agendamento.payment_status
      );
    }

    const { data: atualizado, error: erroAtualizacao } =
      await updateQuery.select("id").maybeSingle();

    if (erroAtualizacao) {
      console.error("ERRO AO ATUALIZAR STATUS DO PAGAMENTO:", erroAtualizacao);
      return NextResponse.json(
        { error: "Não foi possível registrar o status do pagamento." },
        { status: 500 }
      );
    }

    if (!atualizado) {
      const { data: estadoAtual, error: erroEstadoAtual } =
        await supabase
          .from("agendamentos")
          .select("payment_id, payment_status")
          .eq("id", appointmentId)
          .maybeSingle();

      if (erroEstadoAtual) {
        console.error("ERRO AO CONFIRMAR ESTADO DO PAGAMENTO:", erroEstadoAtual);
        return NextResponse.json(
          { error: "Não foi possível confirmar o estado do pagamento." },
          { status: 500 }
        );
      }

      if (
        estadoAtual &&
        String(estadoAtual.payment_id) === paymentId &&
        (estadoAtual.payment_status === status ||
          estadoAtual.payment_status === "approved")
      ) {
        return NextResponse.json({ ok: true });
      }

      console.error("CONFLITO AO VINCULAR PAGAMENTO:", appointmentId);
      return NextResponse.json(
        { error: "O pagamento conflita com o estado atual do agendamento." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERRO AO PROCESSAR WEBHOOK DO MERCADO PAGO:", error);
    return NextResponse.json(
      { error: "Não foi possível processar a notificação." },
      { status: 500 }
    );
  }
}
