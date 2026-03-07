"use client";

import { useMemo, useState } from "react";

const servicos = [
  "Consulta inicial (R$280,00)",
  "Consulta sessão (R$280,00)",
  "Pacote com 10 ou mais sessões (R$210,00 cada sessão)",
  "Avaliação psicológica para cirurgias bariátricas, vasectomia entre outras cirurgias (R$750,00)",
  "Avaliação Neuropsicologia - TDAH (R$1050,00)",
  "Avaliação Neuropsicologia - TEA (R$1050,00)",
  "Avaliação Neuropsicologia - QI (R$1050,00)",
  "Laudos neuropsicológicos (R$1050,00)",
  "Aplicação ABA (R$280,00)",
  "Pacote com 10 ou mais sessões ABA (R$210,00 cada sessão)",
  "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias (Consulte valores)",
];

const horariosPorDia: Record<string, string[]> = {
  "Segunda-feira": ["19:00", "20:00", "21:00"],
  "Terça-feira": ["13:00", "14:00", "15:00", "16:00"],
  "Quarta-feira": ["19:00", "20:00", "21:00", "22:00"],
  "Quinta-feira": ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
  "Sexta-feira": ["19:00", "20:00", "21:00", "22:00"],
  "Sábado": ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
  Domingo: [],
};

function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function obterDiaSemana(data: string) {
  if (!data) return "";

  const dia = new Date(`${data}T12:00:00`);
  const nomes = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return nomes[dia.getDay()];
}

export default function AgendarPage() {
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");

  const diaSemana = useMemo(() => obterDiaSemana(data), [data]);

  const horariosDisponiveis = useMemo(() => {
    if (!diaSemana) return [];
    return horariosPorDia[diaSemana] || [];
  }, [diaSemana]);

  const dataValida = data ? horariosDisponiveis.length > 0 : false;

  function limparAgendamento() {
    setServico("");
    setData("");
    setHorario("");
    setNome("");
    setCpf("");
    setTelefone("");
    setMensagem("");
  }

  function continuarParaPagamento() {
    if (!servico || !data || !horario || !nome || cpf.replace(/\D/g, "").length !== 11) {
      setMensagem("Preencha todos os campos obrigatórios para continuar.");
      return;
    }

    const resumo = {
      servico,
      data,
      diaSemana,
      horario,
      nome,
      cpf,
      telefone,
    };

    localStorage.setItem("agendamento_daiane", JSON.stringify(resumo));
    setMensagem("Agendamento preenchido com sucesso. Indo para o pagamento...");
    window.location.href = "/pagamento";
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <section className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-slate-800">Agendamento online</h1>
          <p className="mt-4 text-lg text-slate-600">
            Escolha o serviço, selecione um horário disponível e preencha seus dados.
          </p>
          <p className="mt-2 text-slate-500">
            Psicóloga Clínica | Neuropsicologia | Psicanalista
          </p>
          <p className="mt-1 text-slate-500">
            CRP: 12/29150
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur-sm">
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
                    {horariosDisponiveis.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setHorario(item)}
                        className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                          horario === item
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
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
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800"
                  />

                  <input
                    type="text"
                    placeholder="Telefone (opcional)"
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
                  Limpar agendamento
                </button>

                <button
                  type="button"
                  onClick={continuarParaPagamento}
                  className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
                >
                  Continuar para pagamento
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-800">Resumo do agendamento</h2>

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
                <p className="font-semibold text-slate-800">CPF</p>
                <p>{cpf || "CPF ainda não preenchido"}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800">Telefone</p>
                <p>{telefone || "Não informado"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
