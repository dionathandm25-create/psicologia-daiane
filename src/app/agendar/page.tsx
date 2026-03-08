"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatarCPF, horariosPorDia, obterDiaSemana } from "@/lib/horarios";

const servicos = [
  "Consulta inicial",
  "Consulta sessão",
  "Pacote com 10 ou mais sessões",
  "Avaliação Neuropsicologia - TDAH",
  "Avaliação Neuropsicologia - TEA",
  "Avaliação Neuropsicologia - QI",
  "Laudos neuropsicológicos",
  "Aplicação ABA",
  "Pacote com 10 ou mais sessões ABA",
  "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias",
];

export default function AgendarPage() {
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  const diaSemana = useMemo(() => obterDiaSemana(data), [data]);

  const horariosDisponiveis = useMemo(() => {
    if (!diaSemana) return [];
    return horariosPorDia[diaSemana] || [];
  }, [diaSemana]);

  const dataValida = data ? horariosDisponiveis.length > 0 : false;

  useEffect(() => {
    async function carregarHorariosOcupados() {
      if (!data) {
        setHorariosOcupados([]);
        return;
      }

      try {
        const resposta = await fetch(`/api/horarios-ocupados?data=${data}`);
        const json = await resposta.json();
        setHorariosOcupados(json.horarios || []);
      } catch {
        setHorariosOcupados([]);
      }
    }

    carregarHorariosOcupados();
  }, [data]);

  function limparAgendamento() {
    setServico("");
    setData("");
    setHorario("");
    setNome("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setMensagem("");
    setHorariosOcupados([]);
  }

  async function salvarAgendamento() {
    setMensagem("");

    if (!servico || !data || !horario || !nome || !email) {
      setMensagem("Preencha serviço, data, horário, nome e e-mail.");
      return;
    }

    setEnviando(true);

    try {
      const supabase = createClient();

      const { data: agendamentoCriado, error } = await supabase
        .from("agendamentos")
        .insert([
          {
            nome,
            email,
            telefone,
            servico,
            data,
            horario,
            payment_status: "pendente",
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setMensagem("Esse horário já foi ocupado. Escolha outro.");
          setHorario("");
        } else {
          setMensagem("Erro ao salvar agendamento.");
        }
        setEnviando(false);
        return;
      }

      localStorage.setItem(
        "agendamento_daiane",
        JSON.stringify(agendamentoCriado)
      );

      setMensagem("Agendamento salvo com sucesso! Indo para pagamento...");

      setTimeout(() => {
        window.location.href = "/pagamento";
      }, 1000);
    } catch {
      setMensagem("Erro de conexão ao salvar o agendamento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <section className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-slate-800">
            Agendamento on-line
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Escolha o serviço, selecione um horário disponível e preencha seus dados.
          </p>
          <p className="mt-2 text-slate-500">
            Psicóloga Clínica | Psicanalista | Neuropsicóloga
          </p>
          <p className="mt-1 text-slate-500">CRP: 12/29150</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur-sm lg:col-span-2">
            <div className="space-y-8">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  1. Escolha o serviço
                </label>
                <select
                  value={servico}
                  onChange={(e) => setServico(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  2. Escolha a data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => {
                    setData(e.target.value);
                    setHorario("");
                    setMensagem("");
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                />

                {data && (
                  <p className="mt-2 text-sm text-slate-600">
                    Dia selecionado: <strong>{diaSemana || "Data inválida"}</strong>
                  </p>
                )}

                {data && !dataValida && (
                  <p className="mt-2 text-sm text-red-600">
                    Não há atendimento neste dia. Escolha outra data.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  3. Escolha o horário
                </label>

                {dataValida ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {horariosDisponiveis.map((item) => {
                      const ocupado = horariosOcupados.includes(item);

                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={ocupado}
                          onClick={() => setHorario(item)}
                          className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                            ocupado
                              ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400"
                              : horario === item
                              ? "border-slate-800 bg-slate-800 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                          }`}
                        >
                          {ocupado ? `${item} • Ocupado` : item}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    Selecione uma data válida para ver os horários disponíveis.
                  </div>
                )}
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  4. Dados do paciente
                </label>

                <div className="grid gap-4">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                  />

                  <input
                    type="text"
                    placeholder="CPF (opcional)"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                  />

                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                  />

                  <input
                    type="text"
                    placeholder="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                  />
                </div>
              </div>

              {mensagem && (
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {mensagem}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={limparAgendamento}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  onClick={salvarAgendamento}
                  disabled={enviando}
                  className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {enviando ? "Salvando..." : "Confirmar agendamento"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Resumo do agendamento
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">Serviço</p>
                <p>{servico || "Nenhum serviço selecionado"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Data</p>
                <p>{data || "Nenhuma data selecionada"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Dia da semana</p>
                <p>{diaSemana || "Nenhum dia selecionado"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Horário</p>
                <p>{horario || "Nenhum horário selecionado"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Paciente</p>
                <p>{nome || "Nome ainda não preenchido"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">E-mail</p>
                <p>{email || "E-mail ainda não preenchido"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Telefone</p>
                <p>{telefone || "Telefone ainda não preenchido"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
