"use client";

import { useMemo, useState } from "react";
import { formatarCPF, horariosPorDia, obterDiaSemana } from "@/lib/horarios";

const servicos = [
  { nome: "Consulta inicial", valor: 280, label: "R$280,00" },
  { nome: "Consulta sessão", valor: 280, label: "R$280,00" },
  { nome: "Pacote com 10 ou mais sessões", valor: 210, label: "R$210,00 cada sessão" },
  {
    nome: "Avaliação psicológica para cirurgias bariátricas, vasectomia entre outras cirurgias",
    valor: null,
    label: "Consulte valores",
  },
  { nome: "Avaliação neuropsicológica - TDAH", valor: 1050, label: "R$1050,00" },
  { nome: "Avaliação neuropsicológica - TEA", valor: 1050, label: "R$1050,00" },
  { nome: "Avaliação neuropsicológica - QI", valor: 1050, label: "R$1050,00" },
  { nome: "Laudos neuropsicológicos", valor: 1050, label: "R$1050,00" },
  { nome: "Aplicação ABA", valor: 280, label: "R$280,00" },
  { nome: "Pacote com 10 ou mais sessões ABA", valor: 210, label: "R$210,00 cada sessão" },
  {
    nome: "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias",
    valor: 750,
    label: "R$750,00",
  },
];

export default function AgendarPage() {
  const [servico, setServico] = useState("");
  const [abrirServicos, setAbrirServicos] = useState(false);

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const diaSemana = useMemo(() => obterDiaSemana(data), [data]);

  const horariosDisponiveis = useMemo(() => {
    if (!diaSemana) return [];
    return horariosPorDia[diaSemana] || [];
  }, [diaSemana]);

  const servicoSelecionado = servicos.find((item) => item.nome === servico);

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">

      <section className="mx-auto max-w-5xl">

        <h1 className="text-4xl font-bold text-center text-slate-800">
          Agendamento on-line
        </h1>

        <div className="mt-12 rounded-3xl border border-rose-100 bg-rose-50/90 p-8 shadow-lg">

          {/* SERVIÇO */}

          <div className="mb-8">

            <label className="mb-3 block text-sm font-semibold text-slate-700">
              1. Escolha o serviço
            </label>

            <button
              type="button"
              onClick={() => setAbrirServicos(true)}
              className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4 text-left text-slate-800"
            >
              {servicoSelecionado
                ? `${servicoSelecionado.nome} (${servicoSelecionado.label})`
                : "Selecione um serviço"}
            </button>

          </div>

          {/* MODAL SERVIÇOS */}

          {abrirServicos && (

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

              <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-rose-50 p-6 shadow-xl">

                <h3 className="mb-4 text-xl font-bold text-slate-800">
                  Selecione um serviço
                </h3>

                <div className="space-y-3">

                  {servicos.map((item) => (

                    <button
                      key={item.nome}
                      type="button"
                      onClick={() => {
                        setServico(item.nome);
                        setAbrirServicos(false);
                      }}
                      className={`w-full rounded-2xl border px-4 py-4 text-left ${
                        servico === item.nome
                          ? "border-rose-400 bg-white"
                          : "border-rose-200 bg-white hover:bg-rose-100"
                      }`}
                    >

                      <span className="block font-semibold text-slate-800">
                        {item.nome}
                      </span>

                      <span className="text-sm text-slate-600">
                        {item.label}
                      </span>

                    </button>

                  ))}

                </div>

                <button
                  onClick={() => setAbrirServicos(false)}
                  className="mt-6 w-full rounded-2xl bg-slate-800 py-3 text-white"
                >
                  Fechar
                </button>

              </div>

            </div>

          )}

          {/* DATA */}

          <div className="mb-8">

            <label className="mb-3 block text-sm font-semibold text-slate-700">
              2. Escolha a data
            </label>

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4"
            />

          </div>

          {/* HORÁRIOS */}

          <div className="mb-8">

            <label className="mb-3 block text-sm font-semibold text-slate-700">
              3. Escolha o horário
            </label>

            <div className="grid grid-cols-2 gap-3">

              {horariosDisponiveis.map((h) => (

                <button
                  key={h}
                  onClick={() => setHorario(h)}
                  className={`rounded-2xl border py-3 ${
                    horario === h
                      ? "bg-slate-800 text-white"
                      : "bg-white border-rose-200"
                  }`}
                >
                  {h}
                </button>

              ))}

            </div>

          </div>

          {/* DADOS */}

          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-700">
              4. Dados do paciente
            </label>

            <div className="space-y-4">

              <input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4"
              />

              <input
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4"
              />

              <input
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4"
              />

              <input
                placeholder="Telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4"
              />

            </div>

            <button className="mt-6 w-full rounded-2xl bg-slate-800 py-4 text-white font-semibold">
              Confirmar agendamento
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}
