"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMAIL_ADMIN = "contatocomercial.dionathandev@gmail.com";

const TIPOS_REGISTRO = [
  {
    valor: "anotacao",
    nome: "Anotação",
  },
  {
    valor: "informacao_extra",
    nome: "Informação adicional",
  },
  {
    valor: "observacao",
    nome: "Observação",
  },
  {
    valor: "evolucao",
    nome: "Evolução",
  },
  {
    valor: "orientacao",
    nome: "Orientação",
  },
  {
    valor: "outro",
    nome: "Outro",
  },
] as const;

type TipoRegistro =
  (typeof TIPOS_REGISTRO)[number]["valor"];

type Agendamento = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  payment_status: string | null;
  atendimento_status: string;
  atendimento_inicio: string | null;
  atendimento_fim: string | null;
};

type Registro = {
  id: number;
  created_at: string;
  atendimento_id: number;
  tipo: TipoRegistro;
  conteudo: string;
};

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return [horas, minutos, segundosRestantes]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

function nomeTipoRegistro(tipo: string) {
  const encontrado = TIPOS_REGISTRO.find(
    (item) => item.valor === tipo
  );

  return encontrado?.nome || "Outro";
}

export default function AtendimentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [agendamento, setAgendamento] =
    useState<Agendamento | null>(null);

  const [registros, setRegistros] = useState<Registro[]>([]);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<TipoRegistro>("anotacao");

  const [conteudoNovoRegistro, setConteudoNovoRegistro] =
    useState("");

  const [editandoRegistroId, setEditandoRegistroId] =
    useState<number | null>(null);

  const [textoEdicao, setTextoEdicao] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingRegistros, setLoadingRegistros] =
    useState(true);

  const [salvandoRegistro, setSalvandoRegistro] =
    useState(false);

  const [salvandoEdicao, setSalvandoEdicao] =
    useState(false);

  const [processando, setProcessando] =
    useState(false);

  const [erro, setErro] = useState("");

  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, []);

  async function carregarRegistros(atendimentoId: number) {
    setLoadingRegistros(true);

    try {
      const resposta = await fetch(
        `/api/atendimento-registros?atendimento_id=${atendimentoId}`,
        {
          cache: "no-store",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível carregar os registros."
        );
      }

      setRegistros(resultado.registros || []);
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR REGISTROS:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os registros."
      );
    } finally {
      setLoadingRegistros(false);
    }
  }

  useEffect(() => {
    async function carregar() {
      if (!id) return;

      try {
        const supabase = createClient();

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(
            "Não foi possível verificar sua sessão."
          );
        }

        const emailUsuario =
          session?.user.email?.toLowerCase();

        if (
          !session ||
          emailUsuario !== EMAIL_ADMIN
        ) {
          router.replace("/admin");
          return;
        }

        const { data, error } = await supabase
          .from("agendamentos")
          .select(
            "id, nome, email, telefone, servico, data, horario, payment_status, atendimento_status, atendimento_inicio, atendimento_fim"
          )
          .eq("id", id)
          .single();

        if (error) {
          console.error(
            "ERRO AO CARREGAR ATENDIMENTO:",
            error
          );

          throw new Error(
            "Não foi possível encontrar este agendamento."
          );
        }

        setAgendamento(data);
        setErro("");

        await carregarRegistros(data.id);
      } catch (error) {
        console.error(
          "ERRO NO ATENDIMENTO:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar o atendimento."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id, router]);

  const duracao = useMemo(() => {
    if (!agendamento?.atendimento_inicio) {
      return 0;
    }

    const inicio = new Date(
      agendamento.atendimento_inicio
    ).getTime();

    const fim = agendamento.atendimento_fim
      ? new Date(
          agendamento.atendimento_fim
        ).getTime()
      : agora;

    return Math.max(
      0,
      Math.floor((fim - inicio) / 1000)
    );
  }, [agendamento, agora]);

  async function iniciarAtendimento() {
    if (!agendamento) return;

    setProcessando(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: agendamento.id,
            acao: "iniciar",
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível iniciar o atendimento."
        );
      }

      setAgendamento(resultado.agendamento);
    } catch (error) {
      console.error(
        "ERRO AO INICIAR ATENDIMENTO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o atendimento."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function finalizarAtendimento() {
    if (!agendamento) return;

    const confirmar = window.confirm(
      "Deseja realmente finalizar este atendimento?"
    );

    if (!confirmar) return;

    setProcessando(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: agendamento.id,
            acao: "finalizar",
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível finalizar o atendimento."
        );
      }

      setAgendamento(resultado.agendamento);
    } catch (error) {
      console.error(
        "ERRO AO FINALIZAR ATENDIMENTO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o atendimento."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function salvarNovoRegistro() {
    if (!agendamento) return;

    const conteudo =
      conteudoNovoRegistro.trim();

    if (!conteudo) {
      setErro(
        "Digite alguma informação antes de salvar."
      );

      return;
    }

    setSalvandoRegistro(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento-registros",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            atendimento_id: agendamento.id,
            tipo: categoriaSelecionada,
            conteudo,
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível salvar o registro."
        );
      }

      setRegistros((atual) => [
        ...atual,
        resultado.registro,
      ]);

      setConteudoNovoRegistro("");
    } catch (error) {
      console.error(
        "ERRO AO SALVAR REGISTRO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o registro."
      );
    } finally {
      setSalvandoRegistro(false);
    }
  }

  function iniciarEdicao(registro: Registro) {
    setEditandoRegistroId(registro.id);
    setTextoEdicao(registro.conteudo);
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoRegistroId(null);
    setTextoEdicao("");
  }

  async function salvarEdicao() {
    if (!editandoRegistroId) return;

    const conteudo = textoEdicao.trim();

    if (!conteudo) {
      setErro(
        "O conteúdo do registro não pode ficar vazio."
      );

      return;
    }

    setSalvandoEdicao(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento-registros",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editandoRegistroId,
            conteudo,
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível editar o registro."
        );
      }

      setRegistros((atual) =>
        atual.map((registro) =>
          registro.id === editandoRegistroId
            ? resultado.registro
            : registro
        )
      );

      setEditandoRegistroId(null);
      setTextoEdicao("");
    } catch (error) {
      console.error(
        "ERRO AO EDITAR REGISTRO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível editar o registro."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirRegistro(
    registroId: number
  ) {
    const confirmar = window.confirm(
      "Excluir este registro?"
    );

    if (!confirmar) return;

    try {
      const resposta = await fetch(
        "/api/atendimento-registros",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: registroId,
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível excluir o registro."
        );
      }

      setRegistros((atual) =>
        atual.filter(
          (registro) =>
            registro.id !== registroId
        )
      );

      if (
        editandoRegistroId === registroId
      ) {
        cancelarEdicao();
      }
    } catch (error) {
      console.error(
        "ERRO AO EXCLUIR REGISTRO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o registro."
      );
    }
  }

  function voltarPainel() {
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <p className="text-slate-700">
            Carregando atendimento...
          </p>
        </div>
      </div>
    );
  }

  if (erro && !agendamento) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <h1 className="text-2xl font-bold text-slate-800">
            Atendimento não encontrado
          </h1>

          <p className="mt-4 text-red-600">
            {erro}
          </p>

          <button
            type="button"
            onClick={voltarPainel}
            className="mt-8 rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Voltar para o painel
          </button>
        </div>
      </div>
    );
  }

  if (!agendamento) return null;

  const emAndamento =
    agendamento.atendimento_status ===
    "em_andamento";

  const finalizado =
    agendamento.atendimento_status ===
    "finalizado";

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white/90 p-8 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Atendimento #{agendamento.id}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-800">
              {agendamento.nome}
            </h1>

            <p className="mt-2 text-slate-600">
              {agendamento.servico}
            </p>
          </div>

          <button
            type="button"
            onClick={voltarPainel}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </button>
        </div>

        {erro && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            {erro}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-800">
              Dados do paciente
            </h2>

            <div className="mt-5 space-y-3 text-slate-700">
              <p>
                <strong>Nome:</strong>{" "}
                {agendamento.nome}
              </p>

              <p>
                <strong>E-mail:</strong>{" "}
                {agendamento.email ||
                  "Não informado"}
              </p>

              <p>
                <strong>Telefone:</strong>{" "}
                {agendamento.telefone ||
                  "Não informado"}
              </p>

              <p>
                <strong>Serviço:</strong>{" "}
                {agendamento.servico}
              </p>

              <p>
                <strong>Data:</strong>{" "}
                {formatarData(
                  agendamento.data
                )}
              </p>

              <p>
                <strong>Horário:</strong>{" "}
                {agendamento.horario}
              </p>

              <p>
                <strong>Pagamento:</strong>{" "}
                {agendamento.payment_status ||
                  "pendente"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-6 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              Controle do atendimento
            </h2>

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {finalizado
                  ? "Finalizado"
                  : emAndamento
                  ? "Em andamento"
                  : "Aguardando"}
              </p>

              <div className="mt-6 text-5xl font-bold tabular-nums text-slate-800">
                {formatarDuracao(duracao)}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {!emAndamento &&
                  !finalizado && (
                    <button
                      type="button"
                      onClick={
                        iniciarAtendimento
                      }
                      disabled={processando}
                      className="rounded-2xl bg-green-600 px-6 py-4 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processando
                        ? "Iniciando..."
                        : "Iniciar atendimento"}
                    </button>
                  )}

                {emAndamento && (
                  <button
                    type="button"
                    onClick={
                      finalizarAtendimento
                    }
                    disabled={processando}
                    className="rounded-2xl bg-red-600 px-6 py-4 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processando
                      ? "Finalizando..."
                      : "Finalizar atendimento"}
                  </button>
                )}

                {finalizado && (
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-700">
                    Atendimento encerrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-bold text-slate-800">
              Início
            </h2>

            <p className="mt-2 text-slate-600">
              {agendamento.atendimento_inicio
                ? new Date(
                    agendamento.atendimento_inicio
                  ).toLocaleString("pt-BR")
                : "Ainda não iniciado"}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-bold text-slate-800">
              Fim
            </h2>

            <p className="mt-2 text-slate-600">
              {agendamento.atendimento_fim
                ? new Date(
                    agendamento.atendimento_fim
                  ).toLocaleString("pt-BR")
                : "Ainda não finalizado"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-50 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Registros do atendimento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organize as informações da consulta
              por categoria.
            </p>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-800">
              Novo registro
            </h3>

            <div className="mt-5">
              <label
                htmlFor="categoria-registro"
                className="block text-sm font-semibold text-slate-700"
              >
                Categoria
              </label>

              <select
                id="categoria-registro"
                value={categoriaSelecionada}
                onChange={(event) =>
                  setCategoriaSelecionada(
                    event.target
                      .value as TipoRegistro
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              >
                {TIPOS_REGISTRO.map(
                  (tipo) => (
                    <option
                      key={tipo.valor}
                      value={tipo.valor}
                    >
                      {tipo.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="mt-5">
              <label
                htmlFor="conteudo-registro"
                className="block text-sm font-semibold text-slate-700"
              >
                Conteúdo
              </label>

              <textarea
                id="conteudo-registro"
                value={
                  conteudoNovoRegistro
                }
                onChange={(event) =>
                  setConteudoNovoRegistro(
                    event.target.value
                  )
                }
                placeholder="Digite aqui as informações do atendimento..."
                rows={8}
                className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <button
              type="button"
              onClick={salvarNovoRegistro}
              disabled={
                salvandoRegistro ||
                !conteudoNovoRegistro.trim()
              }
              className="mt-4 w-full rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvandoRegistro
                ? "Salvando..."
                : "Salvar registro"}
            </button>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800">
                Histórico de registros
              </h3>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {registros.length}{" "}
                {registros.length === 1
                  ? "registro"
                  : "registros"}
              </span>
            </div>

            {loadingRegistros ? (
              <p className="mt-5 text-slate-500">
                Carregando registros...
              </p>
            ) : registros.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-slate-500">
                Nenhum registro salvo ainda.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {registros.map(
                  (registro) => {
                    const estaEditando =
                      editandoRegistroId ===
                      registro.id;

                    return (
                      <div
                        key={registro.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-600">
                              {nomeTipoRegistro(
                                registro.tipo
                              )}
                            </span>

                            <span className="text-xs text-slate-500">
                              {new Date(
                                registro.created_at
                              ).toLocaleString(
                                "pt-BR"
                              )}
                            </span>
                          </div>

                          {!estaEditando && (
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  iniciarEdicao(
                                    registro
                                  )
                                }
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  excluirRegistro(
                                    registro.id
                                  )
                                }
                                className="text-sm font-semibold text-red-600 hover:text-red-700"
                              >
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>

                        {estaEditando ? (
                          <div className="mt-4">
                            <textarea
                              value={textoEdicao}
                              onChange={(
                                event
                              ) =>
                                setTextoEdicao(
                                  event.target
                                    .value
                                )
                              }
                              rows={7}
                              className="w-full resize-y rounded-2xl border border-blue-300 bg-white p-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={
                                  salvarEdicao
                                }
                                disabled={
                                  salvandoEdicao ||
                                  !textoEdicao.trim()
                                }
                                className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {salvandoEdicao
                                  ? "Salvando..."
                                  : "Salvar edição"}
                              </button>

                              <button
                                type="button"
                                onClick={
                                  cancelarEdicao
                                }
                                disabled={
                                  salvandoEdicao
                                }
                                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 whitespace-pre-wrap text-slate-700">
                            {registro.conteudo}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Privacidade:</strong> estes registros
          podem conter informações sensíveis do paciente.
          Mantenha o acesso ao painel restrito e não
          compartilhe essas informações fora do ambiente
          autorizado.
        </div>
      </div>
    </div>
  );
}
