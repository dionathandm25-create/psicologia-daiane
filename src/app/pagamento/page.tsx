"use client";

import { useState } from "react";

export default function PagamentoPage() {
  const [loading, setLoading] = useState(false);

  async function pagar() {
    setLoading(true);

    const res = await fetch("/api/pagamento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ servico: "Consulta psicológica" }),
    });

    const data = await res.json();

    window.location.href = data.init_point;
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

        <button
          onClick={pagar}
          disabled={loading}
          className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-700"
        >
          {loading ? "Redirecionando..." : "Pagar com Mercado Pago"}
        </button>

      </div>
    </div>
  );
}
