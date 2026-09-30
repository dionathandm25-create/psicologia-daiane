import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

async function verificarAdmin() {
  const supabase = await createClient();

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

export async function GET() {
  try {
    /*
     * A API é protegida no servidor.
     * Apenas o administrador autorizado pode consultar
     * os dados financeiros.
     */
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: "Configuração do servidor não encontrada." },
        { status: 500 }
      );
    }

    /*
     * O cliente com service role só é criado depois
     * da autenticação do administrador.
     */
    const supabaseAdmin = createAdminClient(
      supabaseUrl,
      serviceRole,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: agendamentos, error } =
      await supabaseAdmin
        .from("agendamentos")
        .select(
          `
          id,
          nome,
          email,
          servico,
          valor,
          data,
          horario,
          payment_status,
          payment_id,
          preference_id,
          metodo_pagamento,
          paciente_id,
          created_at
        `
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "ERRO AO BUSCAR DADOS FINANCEIROS:",
        error
      );

      return NextResponse.json(
        { error: "Erro ao consultar dados financeiros." },
        { status: 500 }
      );
    }

    const registros = agendamentos ?? [];

    /*
     * Mercado Pago:
     *
     * approved       = pagamento aprovado/recebido
     * pending        = aguardando pagamento
     * in_process     = pagamento em processamento
     * cancelled      = pagamento cancelado
     * refunded       = pagamento reembolsado
     * charged_back   = contestação/estorno
     */
    const recebidos = registros.filter(
      (item) => item.payment_status === "approved"
    );

    const pendentes = registros.filter(
      (item) =>
        item.payment_status === "pending" ||
        item.payment_status === "in_process" ||
        item.payment_status === "pendente"
    );

    const canceladosReembolsados = registros.filter(
      (item) =>
        item.payment_status === "cancelled" ||
        item.payment_status === "canceled" ||
        item.payment_status === "refunded" ||
        item.payment_status === "charged_back"
    );

    const valorRecebido = recebidos.reduce(
      (total, item) => total + Number(item.valor ?? 0),
      0
    );

    const valorPendente = pendentes.reduce(
      (total, item) => total + Number(item.valor ?? 0),
      0
    );

    const valorCanceladoReembolsado =
      canceladosReembolsados.reduce(
        (total, item) =>
          total + Number(item.valor ?? 0),
        0
      );

    /*
     * Agrupamento financeiro por cliente.
     */
    const clientesMap = new Map<
      string,
      {
        paciente_id: number | null;
        nome: string;
        email: string;
        total_recebido: number;
        total_pendente: number;
        total_cancelado_reembolsado: number;
        quantidade_pagamentos: number;
      }
    >();

    for (const item of registros) {
      const chave =
        item.paciente_id !== null &&
        item.paciente_id !== undefined
          ? `paciente-${item.paciente_id}`
          : `email-${item.email}`;

      if (!clientesMap.has(chave)) {
        clientesMap.set(chave, {
          paciente_id: item.paciente_id ?? null,
          nome: item.nome ?? "",
          email: item.email ?? "",
          total_recebido: 0,
          total_pendente: 0,
          total_cancelado_reembolsado: 0,
          quantidade_pagamentos: 0,
        });
      }

      const cliente = clientesMap.get(chave)!;
      const valor = Number(item.valor ?? 0);

      cliente.quantidade_pagamentos += 1;

      if (item.payment_status === "approved") {
        cliente.total_recebido += valor;
      }

      if (
        item.payment_status === "pending" ||
        item.payment_status === "in_process" ||
        item.payment_status === "pendente"
      ) {
        cliente.total_pendente += valor;
      }

      if (
        item.payment_status === "cancelled" ||
        item.payment_status === "canceled" ||
        item.payment_status === "refunded" ||
        item.payment_status === "charged_back"
      ) {
        cliente.total_cancelado_reembolsado +=
          valor;
      }
    }

    const porCliente = Array.from(
      clientesMap.values()
    ).sort(
      (a, b) =>
        b.total_recebido - a.total_recebido
    );

    return NextResponse.json({
      resumo: {
        total_recebido: valorRecebido,
        total_pendente: valorPendente,
        total_cancelado_reembolsado:
          valorCanceladoReembolsado,
        quantidade_recebidos: recebidos.length,
        quantidade_pendentes: pendentes.length,
        quantidade_cancelados_reembolsados:
          canceladosReembolsados.length,
        quantidade_total: registros.length,
      },

      por_cliente: porCliente,

      pagamentos: registros,
    });
  } catch (error) {
    console.error(
      "ERRO INTERNO NO FINANCEIRO:",
      error
    );

    return NextResponse.json(
      { error: "Erro interno ao consultar financeiro." },
      { status: 500 }
    );
  }
}
