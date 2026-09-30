"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatarCPF,
  horariosPorDia,
  obterDiaSemana,
} from "@/lib/horarios";

const servicos = [
  {
    nome: "Consulta inicial",
    valor: 280,
    label: "R$280,00",
  },
  {
    nome: "Consulta sessão",
    valor: 280,
    label: "R$280,00",
  },
  {
    nome: "Pacote com 10 ou mais sessões",
    valor: 210,
    label: "R$210,00 cada sessão",
  },
  {
    nome: "Avaliação psicológica para cirurgias bariátricas, vasectomia entre outras cirurgias",
    valor: null,
    label: "Consulte valores",
  },
  {
    nome: "Avaliação neuropsicológica - TDAH",
    valor: 1050,
    label: "R$1050,00",
  },
  {
    nome: "Avaliação neuropsicológica - TEA",
    valor: 1050,
    label: "R$1050,00",
  },
  {
    nome: "Avaliação neuropsicológica - QI",
    valor: 1050,
    label: "R$1050,00",
  },
  {
    nome: "Laudos neuropsicológicos",
    valor: 1050,
    label: "R$1050,00",
  },
  {
    nome: "Aplicação ABA",
    valor: 280,
    label: "R$280,00",
  },
  {
    nome: "Pacote com 10 ou mais sessões ABA",
    valor: 210,
    label: "R$210,00 cada sessão",
  },
  {
    nome: "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias",
    valor: 750,
    label: "R$750,00",
  },
];

function obterHojeLocal() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataDigitada(valor: string) {
  const somenteNumeros = valor.replace(/\D/g, "").slice(0, 8);

  if (somenteNumeros.length <= 2) {
    return somenteNumeros;
  }

  if (somenteNumeros.length <= 4) {
    return `${somenteNumeros.slice(0, 2)}/${somenteNumeros.slice(2)}`;
  }

  return `${somenteNumeros.slice(0, 2)}/${somenteNumeros.slice(
    2,
    4
  )}/${somenteNumeros.slice(4, 8)}`;
}

function converterDataParaISO(data: string) {
  const partes = data.split("/");

  if (partes.length !== 3) {
    return "";
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);

  if (
    !Number.isInteger(dia) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(ano) ||
    partes[0].length !== 2 ||
    partes[1].length !== 2 ||
    partes[2].length !== 4
  ) {
    return "";
  }

  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(
    2,
    "0"
  )}`;
}

function dataValida(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return false;
  }

  const dataObjeto = new Date(ano, mes - 1, dia);

  return (
    dataObjeto.getFullYear() === ano &&
    dataObjeto.getMonth() === mes - 1 &&
    dataObjeto.getDate() === dia
  );
}

function dataDigitadaValida(data: string) {
  const dataISO = converterDataParaISO(data);

  if (!dataISO) {
    return false;
  }

  return dataValida(dataISO);
}

export default function AgendarPage() {
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [dataDigitada, setDataDigitada] = useState("");
  const [horario, setHorario] = useState("");

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [horariosOcupados, setHorariosOcupados] =
    useState<string[]>([]);

  const [abrirServicos, setAbrirServicos] =
    useState(false);

  const hoje = useMemo(() => obterHojeLocal(), []);

  const diaSemana = useMemo(() => {
    if (!dataValida(data)) {
      return "";
    }

    return obterDiaSemana(data);
  }, [data]);

  const horariosDisponiveis = useMemo(() => {
    if (!diaSemana) {
      return [];
    }

    return horariosPorDia[diaSemana] || [];
  }, [diaSemana]);

  const servicoSelecionado = servicos.find(
    (s) => s.nome === servico
  );

  useEffect(() => {
    async function carregarHorariosOcupados() {
      if (!dataValida(data)) {
        setHorariosOcupados([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/horarios-ocupados?data=${encodeURIComponent(
            data
          )}`,
          {
            cache: "no-store",
          }
        );

        const json = await res.json();

        if (!res.ok) {
          setHorariosOcupados([]);
          return;
        }

        setHorariosOcupados(
          Array.isArray(json.horarios)
            ? json.horarios
            : []
        );
      } catch (error) {
        console.error(
          "ERRO AO CARREGAR HORÁRIOS OCUPADOS:",
          error
        );

        setHorariosOcupados([]);
      }
    }

    carregarHorariosOcupados();
  }, [data]);

  function alterarData(valor: string) {
    const novaDataDigitada = formatarDataDigitada(valor);

    setDataDigitada(novaDataDigitada);
    setData("");
    setHorario("");
    setHorariosOcupados([]);
    setMensagem("");

    if (!novaDataDigitada) {
      return;
    }

    if (novaDataDigitada.length < 10) {
      return;
    }

    if (!dataDigitadaValida(novaDataDigitada)) {
      setMensagem(
        "Digite uma data válida no formato DD/MM/AAAA."
      );
      return;
    }

    const novaDataISO =
      converterDataParaISO(novaDataDigitada);

    if (!novaDataISO) {
      return;
    }

    if (novaDataISO < hoje) {
      setMensagem(
        "Escolha uma data de hoje em diante."
      );
      return;
    }

    setData(novaDataISO);
  }

  async function salvarAgendamento() {
    setMensagem("");

    if (!servico) {
      setMensagem("Selecione um serviço.");
      return;
    }

    if (!data) {
      setMensagem("Selecione uma data.");
      return;
    }

    if (!dataValida(data)) {
      setMensagem(
        "A data selecionada é inválida. Escolha uma data válida."
      );
      return;
    }

    if (data < hoje) {
      setMensagem(
        "Escolha uma data de hoje em diante."
      );
      return;
    }

    if (!horario) {
      setMensagem("Selecione um horário.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Preencha o nome completo.");
      return;
    }

    if (!email.trim()) {
      setMensagem("Preencha o e-mail.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/agendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpf.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          servico,
          data,
          horario,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 409) {
          setMensagem(
            resultado?.error ||
              "Esse horário já foi ocupado. Escolha outro."
          );

          setHorario("");
        } else {
          setMensagem(
            resultado?.error ||
              "Não foi possível salvar o agendamento."
          );
        }

        setEnviando(false);
        return;
      }

      const agendamentoParaPagamento = {
        id: resultado.agendamento_id,
        paciente_id: resultado.paciente_id,
        nome: nome.trim(),
        cpf: cpf.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        servico,
        data,
        horario,
        payment_status: "pendente",
      };

      localStorage.setItem(
        "agendamento_daiane",
        JSON.stringify(
          agendamentoParaPagamento
        )
      );

      if (servicoSelecionado?.valor === null) {
        setMensagem(
          "Agendamento salvo. Este serviço está com valor sob consulta. Entre em contato para finalizar."
        );

        setEnviando(false);
        return;
      }

      setMensagem(
        "Agendamento salvo com sucesso! Indo para pagamento..."
      );

      setTimeout(() => {
        window.location.href = "/pagamento";
      }, 800);
    } catch (error) {
      console.error(
        "ERRO AO ENVIAR AGENDAMENTO:",
        error
      );

      setMensagem(
        "Erro de conexão ao salvar o agendamento."
      );

      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-center text-4xl font-bold text-slate-800">
          Agendamento on-line
        </h1>

        <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-md">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              1. Escolha o serviço
            </label>

            <button
              type="button"
              onClick={() =>
                setAbrirServicos(true)
              }
              className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4 text-left text-slate-800"
            >
              {servicoSelecionado
                ? `${servicoSelecionado.nome} (${servicoSelecionado.label})`
                : "Selecione um serviço"}
            </button>
          </div>

          {abrirServicos && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-rose-200 bg-rose-50 p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">
                    Selecione um serviço
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setAbrirServicos(false)
                    }
                    className="rounded-xl px-3 py-2 text-slate-600 hover:bg-rose-100"
                  >
                    Fechar
                  </button>
                </div>

                <div className="space-y-3">
                  {servicos.map((item) => (
                    <button
                      key={item.nome}
                      type="button"
                      onClick={() => {
                        setServico(item.nome);
                        setAbrirServicos(false);
                      }}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        servico === item.nome
                          ? "border-rose-300 bg-white shadow-sm"
                          : "border-rose-200 bg-white hover:bg-rose-100"
                      }`}
                    >
                      <span className="block text-lg font-semibold text-slate-800">
                        {item.nome}
                      </span>

                      <span className="mt-1 block text-sm text-slate-600">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label
              htmlFor="data-agendamento"
              className="mb-3 block text-sm font-semibold text-slate-700"
            >
              2. Escolha a data
            </label>

            <div>
              <input
                id="data-agendamento"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="DD/MM/AAAA"
                value={dataDigitada}
                onChange={(e) =>
                  alterarData(e.target.value)
                }
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-4 text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Digite a data no formato dia/mês/ano.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              3. Escolha o horário
            </label>

            {!data ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                Selecione uma data para visualizar os horários.
              </p>
            ) : !dataValida(data) ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                A data selecionada é inválida.
              </p>
            ) : horariosDisponiveis.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                Não há horários disponíveis para este dia.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {horariosDisponiveis.map((h) => {
                  const ocupado =
                    horariosOcupados.includes(h);

                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={ocupado}
                      onClick={() => setHorario(h)}
                      className={`rounded-xl px-4 py-3 ${
                        ocupado
                          ? "cursor-not-allowed border border-red-200 bg-red-50 text-red-400"
                          : horario === h
                          ? "bg-slate-800 text-white"
                          : "border border-rose-200 bg-white text-slate-800"
                      }`}
                    >
                      {ocupado
                        ? `${h} • Ocupado`
                        : h}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              4. Dados do paciente
            </label>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nome completo
                </label>

                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label
                  htmlFor="cpf"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  CPF
                </label>

                <input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Digite seu CPF"
                  value={cpf}
                  onChange={(e) =>
                    setCpf(
                      formatarCPF(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label
                  htmlFor="telefone"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Telefone / WhatsApp
                </label>

                <input
                  id="telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Digite seu telefone ou WhatsApp"
                  value={telefone}
                  onChange={(e) =>
                    setTelefone(e.target.value)
                  }
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>
          </div>

          {mensagem && (
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm text-slate-700">
              {mensagem}
            </div>
          )}

          <button
            type="button"
            onClick={salvarAgendamento}
            disabled={enviando}
            className="mt-6 w-full rounded-2xl bg-slate-800 py-4 font-semibold text-white disabled:opacity-60"
          >
            {enviando
              ? "Salvando..."
              : "Confirmar agendamento"}
          </button>
        </div>
      </section>
    </div>
  );
}
