import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { verifyGuestPaymentToken } from "@/lib/security/guest-payment-token";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function parseAppointmentId(value: unknown) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    !/^\d+$/.test(String(value))
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function toCents(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100)
    : null;
}

function paymentIsApproved(value: unknown) {
  return (
    typeof value === "string" &&
    ["approved", "aprovado", "paid"].includes(value.toLowerCase())
  );
}

function validatePreference(
  value: unknown,
  appointmentId: number,
  amountInCents: number
) {
  if (!isRecord(value) || value.external_reference !== String(appointmentId)) {
    return null;
  }

  const initPoint =
    typeof value.init_point === "string" ? value.init_point : null;
  if (!initPoint) {
    return null;
  }

  if (!Array.isArray(value.items) || value.items.length === 0) {
    return null;
  }

  const itemTotal = value.items.reduce<number | null>((total, item) => {
    if (!isRecord(item) || item.currency_id !== "BRL") {
      return null;
    }

    const quantity = Number(item.quantity);
    const unitPrice = toCents(item.unit_price);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      unitPrice === null ||
      total === null
    ) {
      return null;
    }

    return total + quantity * unitPrice;
  }, 0);

  if (itemTotal !== amountInCents) {
    return null;
  }

  return {
    init_point: initPoint,
    sandbox_init_point:
      typeof value.sandbox_init_point === "string"
        ? value.sandbox_init_point
        : undefined,
  };
}

async function loadPreference(
  accessToken: string,
  preferenceId: string,
  appointmentId: number,
  amountInCents: number
) {
  const response = await fetch(
    `https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(
      preferenceId
    )}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return validatePreference(
    await response.json(),
    appointmentId,
    amountInCents
  );
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Dados de pagamento inválidos." },
        { status: 400 }
      );
    }

    const appointmentId = parseAppointmentId(body.agendamentoId);
    if (!appointmentId) {
      return NextResponse.json(
        { error: "Agendamento não informado." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuração do servidor não encontrada." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: agendamento,
      error: erroAgendamento,
    } = await supabaseAdmin
      .from("agendamentos")
      .select(
        "id, paciente_id, servico, valor, payment_status, payment_id, preference_id"
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (erroAgendamento) {
      console.error("ERRO AO BUSCAR AGENDAMENTO PARA PAGAMENTO:", erroAgendamento);
      return NextResponse.json(
        { error: "Não foi possível verificar o agendamento." },
        { status: 500 }
      );
    }

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado ou sem autorização." },
        { status: 404 }
      );
    }

    const sessionClient = await createServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    let authenticatedOwner = false;
    if (user) {
      const { data: paciente, error: erroPaciente } = await supabaseAdmin
        .from("pacientes")
        .select("id")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (erroPaciente) {
        console.error("ERRO AO VERIFICAR TITULAR DO AGENDAMENTO:", erroPaciente);
        return NextResponse.json(
          { error: "Não foi possível verificar a titularidade." },
          { status: 500 }
        );
      }

      authenticatedOwner =
        paciente !== null &&
        Number(paciente.id) === Number(agendamento.paciente_id);
    }

    const cookieStore = await cookies();
    const guestToken =
      cookieStore.get(`guest_payment_${appointmentId}`)?.value;
    const validGuestCapability =
      guestToken !== undefined &&
      verifyGuestPaymentToken(
        guestToken,
        appointmentId,
        serviceRoleKey
      );

    if (!authenticatedOwner && !validGuestCapability) {
      return NextResponse.json(
        { error: "Agendamento não encontrado ou sem autorização." },
        { status: 404 }
      );
    }

    if (paymentIsApproved(agendamento.payment_status)) {
      return NextResponse.json(
        { error: "Este agendamento já possui um pagamento aprovado." },
        { status: 409 }
      );
    }

    const currentPaymentStatus =
      typeof agendamento.payment_status === "string"
        ? agendamento.payment_status.toLowerCase()
        : "";
    if (
      agendamento.payment_id &&
      !["rejected", "cancelled", "cancelado"].includes(
        currentPaymentStatus
      )
    ) {
      return NextResponse.json(
        { error: "Já existe um pagamento em processamento para este agendamento." },
        { status: 409 }
      );
    }

    const amountInCents = toCents(agendamento.valor);
    if (amountInCents === null) {
      return NextResponse.json(
        {
          error:
            "Este serviço está sem valor definido para pagamento online. Entre em contato para consultar.",
        },
        { status: 400 }
      );
    }

    const existingPreferenceId =
      typeof agendamento.preference_id === "string" ||
      typeof agendamento.preference_id === "number"
        ? String(agendamento.preference_id)
        : null;
    if (existingPreferenceId) {
      const existingPreference = await loadPreference(
        accessToken,
        existingPreferenceId,
        appointmentId,
        amountInCents
      );

      if (!existingPreference) {
        console.error(
          "A PREFERÊNCIA EXISTENTE NÃO PÔDE SER VALIDADA:",
          appointmentId
        );
        return NextResponse.json(
          { error: "Não foi possível validar o pagamento existente." },
          { status: 502 }
        );
      }

      return NextResponse.json(existingPreference);
    }

    const requestOrigin = new URL(req.url);
    const origemLocalPermitida =
      requestOrigin.hostname === "localhost" ||
      requestOrigin.hostname === "127.0.0.1";
    const origem = origemLocalPermitida
      ? requestOrigin.origin
      : "https://psicologia-daiane.vercel.app";

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
              unit_price: amountInCents / 100,
            },
          ],
          payment_methods: {
            excluded_payment_types: [],
            excluded_payment_methods: [],
            installments: 1,
          },
          external_reference: String(agendamento.id),
          metadata: { appointment_id: agendamento.id },
          back_urls: {
            success: `${origem}/confirmacao`,
            failure: `${origem}/pagamento`,
            pending: `${origem}/pagamento`,
          },
          auto_return: "approved",
          notification_url:
            "https://psicologia-daiane.vercel.app/api/mercadopago/webhook",
        }),
      }
    );

    const preference: unknown = await response.json();
    if (!response.ok || !isRecord(preference)) {
      console.error("ERRO AO CRIAR PREFERÊNCIA NO MERCADO PAGO.");
      return NextResponse.json(
        { error: "Erro ao criar preferência de pagamento." },
        { status: 502 }
      );
    }

    const newPreferenceId =
      typeof preference.id === "string" || typeof preference.id === "number"
        ? String(preference.id)
        : null;
    const newPreference = validatePreference(
      preference,
      appointmentId,
      amountInCents
    );
    if (!newPreferenceId || !newPreference) {
      console.error("RESPOSTA INVÁLIDA AO CRIAR PREFERÊNCIA.");
      return NextResponse.json(
        { error: "Não foi possível validar a preferência de pagamento." },
        { status: 502 }
      );
    }

    const {
      data: preferenceSaved,
      error: erroSalvarPreferencia,
    } = await supabaseAdmin
      .from("agendamentos")
      .update({ preference_id: newPreferenceId })
      .eq("id", appointmentId)
      .is("preference_id", null)
      .is("payment_id", null)
      .or("payment_status.is.null,payment_status.neq.approved")
      .select("id")
      .maybeSingle();

    if (erroSalvarPreferencia) {
      console.error(
        "ERRO AO VINCULAR PREFERÊNCIA AO AGENDAMENTO:",
        erroSalvarPreferencia
      );
      return NextResponse.json(
        { error: "Não foi possível salvar a preferência de pagamento." },
        { status: 500 }
      );
    }

    if (!preferenceSaved) {
      const { data: estadoAtual, error: erroEstadoAtual } =
        await supabaseAdmin
          .from("agendamentos")
          .select("preference_id, payment_status")
          .eq("id", appointmentId)
          .maybeSingle();

      if (erroEstadoAtual) {
        console.error("ERRO AO REVER ESTADO DO PAGAMENTO:", erroEstadoAtual);
        return NextResponse.json(
          { error: "Não foi possível confirmar o estado do pagamento." },
          { status: 500 }
        );
      }

      if (
        !estadoAtual ||
        paymentIsApproved(estadoAtual.payment_status) ||
        typeof estadoAtual.preference_id !== "string"
      ) {
        return NextResponse.json(
          { error: "O pagamento foi alterado. Atualize a página e tente novamente." },
          { status: 409 }
        );
      }

      const winningPreference = await loadPreference(
        accessToken,
        estadoAtual.preference_id,
        appointmentId,
        amountInCents
      );
      if (!winningPreference) {
        return NextResponse.json(
          { error: "Não foi possível validar o pagamento existente." },
          { status: 502 }
        );
      }

      return NextResponse.json(winningPreference);
    }

    return NextResponse.json(newPreference);
  } catch (error) {
    console.error("ERRO INTERNO AO CRIAR PAGAMENTO:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar pagamento." },
      { status: 500 }
    );
  }
}
