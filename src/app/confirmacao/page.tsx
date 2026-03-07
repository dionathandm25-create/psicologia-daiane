"use client";

import { useEffect, useMemo, useState } from "react";

type PagamentoFinal = {
  servico: string;
  data: string;
  diaSemana: string;
  horario: string;
  nome: string;
  cpf: string;
  telefone: string;
  formaPagamento: string;
  parcelamento: string;
  statusPagamento: string;
};

export default function ConfirmacaoPage() {
  const [dados, setDados] = useState<PagamentoFinal | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("pagamento_daiane");
    if (salvo) {
      setDados(JSON.parse(salvo));
    }
  }, []);

  const whatsappUrl = useMemo(() => {
    if (!dados) return "#";

    const numero = "5547999999999";
    const mensagem =
      `Olá! Quero confirmar meu agendamento.%0A` +
      `Nome: ${dados.nome}%0A` +
      `Serviço: ${dados.servico}%0A` +
      `Data: ${dados.data}%0A` +
      `Dia: ${dados.diaSemana}%0A` +
      `Horário: ${dados.horario}%0A` +
      `Pagamento: ${dados.formaPagamento}%0A` +
      `Parcelamento: ${dados.parcelamento}`;

    return `https://wa.me/${numero}?text=${mensagem}`;
  }, [dados]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h1 className="mt-6 text-4xl font-bold text-slate-800">
              Agendamento confirmado com sucesso
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Seu pagamento foi registrado e o resumo do atendimento está abaixo.
            </p>
          </div>

          {dados ? (
            <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-slate-50 p-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Resumo final
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Paciente</p>
                  <p className="mt-1 text-slate-600">{dados.nome}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">CPF</p>
                  <p className="mt-1 text-slate-600">{dados.cpf}</p>
                </div>

                <div className="rounded-2xl bg-white p-4 sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-800">Serviço</p>
                  <p className="mt-1 text-slate-600">{dados.servico}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Data</p>
                  <p className="mt-1 text-slate-600">{dados.data}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Dia da semana</p>
                  <p className="mt-1 text-slate-600">{dados.diaSemana}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Horário</p>
                  <p className="mt-1 text-slate-600">{dados.horario}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Forma de pagamento</p>
                  <p className="mt-1 capitalize text-slate-600">{dados.formaPagamento}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Parcelamento</p>
                  <p className="mt-1 text-slate-600">{dados.parcelamento}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Status</p>
                  <p className="mt-1 text-green-600">{dados.statusPagamento}</p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Telefone</p>
                  <p className="mt-1 text-slate-600">{dados.telefone || "Não informado"}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/"
                  className="rounded-2xl bg-slate-800 px-6 py-4 text-center font-semibold text-white hover:bg-slate-700"
                >
                  Voltar para a home
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="rounded-2xl border border-green-500 bg-green-500 px-6 py-4 text-center font-semibold text-white hover:bg-green-600"
                >
                  Confirmar no WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-slate-50 p-6 text-center">
              <p className="text-slate-600">
                Nenhum pagamento encontrado. Faça o agendamento e o pagamento primeiro.
              </p>

              <div className="mt-6">
                <a
                  href="/agendar"
                  className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
                >
                  Ir para agendamento
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
