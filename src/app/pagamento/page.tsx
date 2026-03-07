"use client";

import { useEffect, useState } from "react";

type Agendamento = {
  servico: string;
  data: string;
  diaSemana: string;
  horario: string;
  nome: string;
  cpf: string;
  telefone: string;
};

export default function PagamentoPage() {
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelamento, setParcelamento] = useState("1x");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const dados = localStorage.getItem("agendamento_daiane");

    if (dados) {
      setAgendamento(JSON.parse(dados));
    }
  }, []);

  function confirmarPagamento() {
    if (!agendamento) {
      setMensagem("Nenhum agendamento encontrado.");
      return;
    }

    if (!formaPagamento) {
      setMensagem("Selecione uma forma de pagamento.");
      return;
    }

    const pagamentoFinal = {
      ...agendamento,
      formaPagamento,
      parcelamento: formaPagamento === "cartao" ? parcelamento : "1x",
      statusPagamento: "confirmado",
    };

    localStorage.setItem("pagamento_daiane", JSON.stringify(pagamentoFinal));
    setMensagem("Pagamento confirmado com sucesso.");
    window.location.href = "/confirmacao";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-slate-800">Pagamento</h1>
          <p className="mt-4 text-lg text-slate-600">
            Revise seu agendamento e escolha a forma de pagamento.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">
              Escolha a forma de pagamento
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setFormaPagamento("pix");
                  setMensagem("");
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  formaPagamento === "pix"
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
              >
                <p className="text-lg font-bold">Pix</p>
                <p className="mt-2 text-sm opacity-90">
                  Pagamento rápido. Área preparada para integração futura.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormaPagamento("cartao");
                  setMensagem("");
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  formaPagamento === "cartao"
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
              >
                <p className="text-lg font-bold">Cartão</p>
                <p className="mt-2 text-sm opacity-90">
                  Pagamento em 1x, 2x ou 3x. Área preparada para integração futura.
                </p>
              </button>
            </div>

            {formaPagamento === "pix" && (
              <div className="mt-6 rounded-2xl bg-slate-100 p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Pagamento via Pix
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Esta área está preparada para futura integração com Mercado Pago.
                </p>
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Chave Pix / QR Code entrarão aqui futuramente.
                </div>
              </div>
            )}

            {formaPagamento === "cartao" && (
              <div className="mt-6 rounded-2xl bg-slate-100 p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Pagamento via Cartão
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Escolha o parcelamento para a simulação.
                </p>

                <select
                  value={parcelamento}
                  onChange={(e) => setParcelamento(e.target.value)}
                  className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-4 text-slate-800"
                >
                  <option value="1x">1x</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                </select>

                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Campos do cartão e integração real entrarão aqui futuramente.
                </div>
              </div>
            )}

            {mensagem && (
              <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {mensagem}
              </div>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={confirmarPagamento}
                className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
              >
                Confirmar pagamento
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Resumo do agendamento</h2>

            {agendamento ? (
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Serviço</p>
                  <p>{agendamento.servico}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Data</p>
                  <p>{agendamento.data}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Dia da semana</p>
                  <p>{agendamento.diaSemana}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Horário</p>
                  <p>{agendamento.horario}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Paciente</p>
                  <p>{agendamento.nome}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">CPF</p>
                  <p>{agendamento.cpf}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Telefone</p>
                  <p>{agendamento.telefone || "Não informado"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Nenhum agendamento encontrado.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
