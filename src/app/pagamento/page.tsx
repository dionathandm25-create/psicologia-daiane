"use client";

import { useEffect, useState } from "react";

type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  servico: string;
  data: string;
  horario: string;
};

export default function PagamentoPage() {
  const [loading, setLoading] = useState(false);
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("agendamento_daiane");
    if (raw) {
      try {
        setAgendamento(JSON.parse(raw));
      } catch {
        setAgendamento(null);
      }
    }
  }, []);

  async function pagar() {
    if (!agendamento?.id) {
      setErro("Agendamento não encontrado para gerar pagamento.");
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/pagamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agendamentoId: agendamento.id,
          servico: agendamento.servico,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao iniciar pagamento.");
        setLoading(false);
        return;
      }

      window.location.href = data.init_point;
    } catch {
      setErro("Erro de conexão ao iniciar pagamento.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16 flex justify-center">
      <div className="max-w-xl rounded-3xl bg-white/90 p-10 shadow-md text-center">
        <h1 className="text-3xl font-bold text-slate-800">
          Pagamento da Consulta
        </h1>

        <p className="mt-4 text-slate-600">
          Finalize o pagamento para confirmar sua consulta.
        </p>

        {erro && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            {erro}
          </div>
        )}

        <button
          onClick={pagar}
          disabled={loading}
          className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Redirecionando..." : "Pagar com Mercado Pago"}
        </button>
      </div>
    </div>
  );
}
