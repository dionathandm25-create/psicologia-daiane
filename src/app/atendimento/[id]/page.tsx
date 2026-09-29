"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMAIL_ADMIN =
  "psi.daianedamasceno@gmail.com";

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

type AudioAtendimento = {
  id: number;
  created_at: string;
  atendimento_id: number;
  storage_path: string;
  duracao_segundos: number | null;
  status: string;
  transcricao: string | null;
  transcricao_editada: string | null;
  transcricao_em: string | null;
  audio_url: string | null;
};

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor(
    (segundos % 3600) / 60
  );
  const segundosRestantes = segundos % 60;

  return [horas, minutos, segundosRestantes]
    .map((valor) =>
      String(valor).padStart(2, "0")
    )
    .join(":");
}

function nomeTipoRegistro(tipo: string) {
  const encontrado = TIPOS_REGISTRO.find(
    (item) => item.valor === tipo
  );

  return encontrado?.nome || "Outro";
}

function textoStatusAudio(status: string) {
  switch (status) {
    case "enviado":
      return "Enviado";

    case "transcrevendo":
      return "Transcrevendo...";

    case "transcrito":
      return "Transcrito";

    case "erro":
      return "Erro";

    default:
      return status;
  }
}

export default function AtendimentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params?.id;

  const [agendamento, setAgendamento] =
    useState<Agendamento | null>(null);

  const [registros, setRegistros] =
    useState<Registro[]>([]);

  const [audios, setAudios] =
    useState<AudioAtendimento[]>([]);

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState<TipoRegistro>("anotacao");

  const [
    conteudoNovoRegistro,
    setConteudoNovoRegistro,
  ] = useState("");

  const [
    editandoRegistroId,
    setEditandoRegistroId,
  ] = useState<number | null>(null);

  const [textoEdicao, setTextoEdicao] =
    useState("");

  const [buscaRegistros, setBuscaRegistros] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    loadingRegistros,
    setLoadingRegistros,
  ] = useState(true);

  const [
    loadingAudios,
    setLoadingAudios,
  ] = useState(true);

  const [
    salvandoRegistro,
    setSalvandoRegistro,
  ] = useState(false);

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false);

  const [processando, setProcessando] =
    useState(false);

  const [
    gravandoAudio,
    setGravandoAudio,
  ] = useState(false);

  const [
    processandoAudio,
    setProcessandoAudio,
  ] = useState(false);

  const [audioBlob, setAudioBlob] =
    useState<Blob | null>(null);

  const [audioUrl, setAudioUrl] =
    useState("");

  const [duracaoAudio, setDuracaoAudio] =
    useState(0);

  const [
    inicioGravacaoAudio,
    setInicioGravacaoAudio,
  ] = useState<number | null>(null);

  const [audioEnviado, setAudioEnviado] =
    useState(false);

  const [mensagemAudio, setMensagemAudio] =
    useState("");

  const [
    transcrevendoAudioId,
    setTranscrevendoAudioId,
  ] = useState<number | null>(null);

  const [
    salvandoTranscricaoId,
    setSalvandoTranscricaoId,
  ] = useState<number | null>(null);

  const [
    transcricaoEmEdicaoId,
    setTranscricaoEmEdicaoId,
  ] = useState<number | null>(null);

  const [
    textoTranscricaoEdicao,
    setTextoTranscricaoEdicao,
  ] = useState("");

  const [erro, setErro] =
    useState("");

  const [agora, setAgora] =
    useState(Date.now());

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const chunksRef =
    useRef<Blob[]>([]);

  const audioUrlRef =
    useRef<string | null>(null);

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setAgora(Date.now());
      }, 1000);

    return () =>
      window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current
        );
      }
    };
  }, []);

  async function carregarRegistros(
    atendimentoId: number
  ) {
    setLoadingRegistros(true);

    try {
      const resposta = await fetch(
        `/api/atendimento-registros?atendimento_id=${atendimentoId}`,
        {
          cache: "no-store",
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível carregar os registros."
        );
      }

      setRegistros(
        resultado.registros || []
      );
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

  async function carregarAudios(
    atendimentoId: number
  ) {
    setLoadingAudios(true);

    try {
      const resposta = await fetch(
        `/api/atendimento-audio?atendimento_id=${atendimentoId}`,
        {
          cache: "no-store",
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível carregar os áudios."
        );
      }

      setAudios(
        resultado.audios || []
      );
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR ÁUDIOS:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os áudios."
      );
    } finally {
      setLoadingAudios(false);
    }
  }

  useEffect(() => {
    async function carregar() {
      if (!id) return;

      try {
        const supabase =
          createClient();

        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

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

        const {
          data,
          error,
        } = await supabase
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

        await Promise.all([
          carregarRegistros(data.id),
          carregarAudios(data.id),
        ]);
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
    if (
      !agendamento?.atendimento_inicio
    ) {
      return 0;
    }

    const inicio =
      new Date(
        agendamento.atendimento_inicio
      ).getTime();

    const fim =
      agendamento.atendimento_fim
        ? new Date(
            agendamento.atendimento_fim
          ).getTime()
        : agora;

    return Math.max(
      0,
      Math.floor(
        (fim - inicio) / 1000
      )
    );
  }, [agendamento, agora]);

  const registrosFiltrados =
    useMemo(() => {
      const busca =
        buscaRegistros
          .trim()
          .toLowerCase();

      if (!busca) {
        return registros;
      }

      return registros.filter(
        (registro) =>
          registro.conteudo
            .toLowerCase()
            .includes(busca) ||
          nomeTipoRegistro(
            registro.tipo
          )
            .toLowerCase()
            .includes(busca)
      );
    }, [
      registros,
      buscaRegistros,
    ]);

  const duracaoTotalAudios =
    useMemo(() => {
      return audios.reduce(
        (total, audio) =>
          total +
          (audio.duracao_segundos ||
            0),
        0
      );
    }, [audios]);

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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: agendamento.id,
            acao: "iniciar",
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível iniciar o atendimento."
        );
      }

      setAgendamento(
        resultado.agendamento
      );
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

    const confirmar =
      window.confirm(
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: agendamento.id,
            acao: "finalizar",
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível finalizar o atendimento."
        );
      }

      setAgendamento(
        resultado.agendamento
      );
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            atendimento_id:
              agendamento.id,
            tipo:
              categoriaSelecionada,
            conteudo,
          }),
        }
      );

      const resultado =
        await resposta.json();

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

  function iniciarEdicao(
    registro: Registro
  ) {
    setEditandoRegistroId(
      registro.id
    );

    setTextoEdicao(
      registro.conteudo
    );

    setErro("");
  }

  function cancelarEdicao() {
    setEditandoRegistroId(null);
    setTextoEdicao("");
  }

  async function salvarEdicao() {
    if (!editandoRegistroId) return;

    const conteudo =
      textoEdicao.trim();

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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: editandoRegistroId,
            conteudo,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível editar o registro."
        );
      }

      setRegistros((atual) =>
        atual.map((registro) =>
          registro.id ===
          editandoRegistroId
            ? resultado.registro
            : registro
        )
      );

      cancelarEdicao();
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
    const confirmar =
      window.confirm(
        "Excluir este registro?"
      );

    if (!confirmar) return;

    try {
      const resposta = await fetch(
        "/api/atendimento-registros",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: registroId,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível excluir o registro."
        );
      }

      setRegistros((atual) =>
        atual.filter(
          (registro) =>
            registro.id !==
            registroId
        )
      );

      if (
        editandoRegistroId ===
        registroId
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

  async function iniciarGravacaoAudio() {
    if (gravandoAudio) return;

    setMensagemAudio("");
    setErro("");
    setAudioEnviado(false);

    if (
      typeof navigator ===
        "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {
      setMensagemAudio(
        "Seu navegador não permite acesso ao microfone."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      streamRef.current =
        stream;

      chunksRef.current = [];

      const tiposAceitos = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];

      const mimeType =
        tiposAceitos.find(
          (tipo) =>
            MediaRecorder.isTypeSupported(
              tipo
            )
        ) || "";

      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              {
                mimeType,
              }
            )
          : new MediaRecorder(
              stream
            );

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const tipo =
          recorder.mimeType ||
          "audio/webm";

        const blob =
          new Blob(
            chunksRef.current,
            {
              type: tipo,
            }
          );

        setAudioBlob(blob);

        if (audioUrlRef.current) {
          URL.revokeObjectURL(
            audioUrlRef.current
          );
        }

        const novaUrl =
          URL.createObjectURL(
            blob
          );

        audioUrlRef.current =
          novaUrl;

        setAudioUrl(novaUrl);

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current =
          null;
      };

      recorder.onerror = () => {
        setMensagemAudio(
          "Ocorreu um erro durante a gravação."
        );

        setGravandoAudio(false);
      };

      recorder.start();

      setInicioGravacaoAudio(
        Date.now()
      );

      setDuracaoAudio(0);
      setGravandoAudio(true);
    } catch (error) {
      console.error(
        "ERRO AO INICIAR GRAVAÇÃO:",
        error
      );

      setMensagemAudio(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador."
      );

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current =
        null;
    }
  }

  function pararGravacaoAudio() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }

    const inicio =
      inicioGravacaoAudio ||
      Date.now();

    const duracao = Math.max(
      0,
      Math.floor(
        (Date.now() - inicio) /
          1000
      )
    );

    setDuracaoAudio(
      duracao
    );

    recorder.stop();

    setGravandoAudio(false);
    setInicioGravacaoAudio(null);
  }

  function descartarAudio() {
    if (gravandoAudio) {
      pararGravacaoAudio();
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(
        audioUrlRef.current
      );
    }

    audioUrlRef.current = null;

    setAudioBlob(null);
    setAudioUrl("");
    setDuracaoAudio(0);
    setAudioEnviado(false);
    setMensagemAudio("");
  }

  async function enviarAudio() {
    if (
      !agendamento ||
      !audioBlob
    ) {
      return;
    }

    setProcessandoAudio(true);
    setMensagemAudio("");
    setErro("");

    try {
      const extensao =
        audioBlob.type.includes(
          "mp4"
        )
          ? "mp4"
          : audioBlob.type.includes(
              "ogg"
            )
          ? "ogg"
          : "webm";

      const arquivo =
        new File(
          [
            audioBlob,
          ],
          `atendimento-${agendamento.id}-${Date.now()}.${extensao}`,
          {
            type:
              audioBlob.type ||
              "audio/webm",
          }
        );

      const formData =
        new FormData();

      formData.append(
        "atendimento_id",
        String(
          agendamento.id
        )
      );

      formData.append(
        "arquivo",
        arquivo
      );

      formData.append(
        "duracao_segundos",
        String(
          duracaoAudio
        )
      );

      const resposta = await fetch(
        "/api/atendimento-audio",
        {
          method: "POST",
          body: formData,
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível enviar o áudio."
        );
      }

      if (resultado.audio) {
        setAudios((atual) => [
          ...atual,
          resultado.audio,
        ]);
      }

      setAudioEnviado(true);

      setMensagemAudio(
        "Áudio enviado com segurança."
      );

      setAudioBlob(null);

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current
        );
      }

      audioUrlRef.current =
        null;

      setAudioUrl("");
    } catch (error) {
      console.error(
        "ERRO AO ENVIAR ÁUDIO:",
        error
      );

      setMensagemAudio(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o áudio."
      );
    } finally {
      setProcessandoAudio(false);
    }
  }

  async function transcreverAudio(
    audio: AudioAtendimento
  ) {
    if (!agendamento) return;

    if (
      audio.status ===
      "transcrevendo"
    ) {
      return;
    }

    setTranscrevendoAudioId(
      audio.id
    );

    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento-transcricao",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            atendimento_id:
              agendamento.id,
            audio_id:
              audio.id,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível transcrever o áudio."
        );
      }

      setAudios((atual) =>
        atual.map(
          (item) =>
            item.id === audio.id
              ? {
                  ...item,
                  status:
                    "transcrito",
                  transcricao:
                    resultado.transcricao,
                  transcricao_em:
                    new Date().toISOString(),
                }
              : item
        )
      );
    } catch (error) {
      console.error(
        "ERRO AO TRANSCRIBIR ÁUDIO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível transcrever o áudio."
      );

      setAudios((atual) =>
        atual.map(
          (item) =>
            item.id === audio.id
              ? {
                  ...item,
                  status:
                    "erro",
                }
              : item
        )
      );
    } finally {
      setTranscrevendoAudioId(
        null
      );
    }
  }

  function iniciarEdicaoTranscricao(
    audio: AudioAtendimento
  ) {
    const texto =
      audio.transcricao_editada ||
      audio.transcricao ||
      "";

    setTranscricaoEmEdicaoId(
      audio.id
    );

    setTextoTranscricaoEdicao(
      texto
    );

    setErro("");
  }

  function cancelarEdicaoTranscricao() {
    setTranscricaoEmEdicaoId(
      null
    );

    setTextoTranscricaoEdicao(
      ""
    );
  }

  async function salvarTranscricao(
    audio: AudioAtendimento
  ) {
    if (!agendamento) return;

    const texto =
      textoTranscricaoEdicao.trim();

    if (!texto) {
      setErro(
        "A transcrição revisada não pode ficar vazia."
      );

      return;
    }

    setSalvandoTranscricaoId(
      audio.id
    );

    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento-audio",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            atendimento_id:
              agendamento.id,
            audio_id:
              audio.id,
            transcricao_editada:
              texto,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível salvar a transcrição."
        );
      }

      setAudios((atual) =>
        atual.map(
          (item) =>
            item.id === audio.id
              ? {
                  ...item,
                  transcricao_editada:
                    resultado.audio
                      ?.transcricao_editada ||
                    texto,
                }
              : item
        )
      );

      cancelarEdicaoTranscricao();
    } catch (error) {
      console.error(
        "ERRO AO SALVAR TRANSCRIÇÃO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a transcrição."
      );
    } finally {
      setSalvandoTranscricaoId(
        null
      );
    }
  }

  async function copiarTranscricao(
    texto: string
  ) {
    try {
      await navigator.clipboard.writeText(
        texto
      );

      setMensagemAudio(
        "Transcrição copiada."
      );

      window.setTimeout(() => {
        setMensagemAudio("");
      }, 2500);
    } catch (error) {
      console.error(
        "ERRO AO COPIAR TRANSCRIÇÃO:",
        error
      );

      setErro(
        "Não foi possível copiar a transcrição."
      );
    }
  }

  async function transformarTranscricaoEmRegistro(
    audio: AudioAtendimento
  ) {
    if (!agendamento) return;

    const texto =
      (
        audio.transcricao_editada ||
        audio.transcricao ||
        ""
      ).trim();

    if (!texto) {
      setErro(
        "Este áudio ainda não possui uma transcrição."
      );

      return;
    }

    const confirmar =
      window.confirm(
        "Deseja adicionar esta transcrição ao prontuário como uma anotação clínica?"
      );

    if (!confirmar) return;

    setSalvandoRegistro(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/atendimento-registros",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            atendimento_id:
              agendamento.id,
            tipo: "anotacao",
            conteudo: texto,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível adicionar a transcrição ao prontuário."
        );
      }

      setRegistros((atual) => [
        ...atual,
        resultado.registro,
      ]);

      setMensagemAudio(
        "Transcrição adicionada ao prontuário."
      );

      window.setTimeout(() => {
        setMensagemAudio("");
      }, 3000);
    } catch (error) {
      console.error(
        "ERRO AO TRANSFORMAR TRANSCRIÇÃO EM REGISTRO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a transcrição ao prontuário."
      );
    } finally {
      setSalvandoRegistro(false);
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
              Atendimento #
              {agendamento.id}
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
                {formatarDuracao(
                  duracao
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {!emAndamento &&
                  !finalizado && (
                    <button
                      type="button"
                      onClick={
                        iniciarAtendimento
                      }
                      disabled={
                        processando
                      }
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
                    disabled={
                      processando
                    }
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
                  ).toLocaleString(
                    "pt-BR"
                  )
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
                  ).toLocaleString(
                    "pt-BR"
                  )
                : "Ainda não finalizado"}
            </p>
          </div>
        </div>

        {/* ÁUDIO */}
        <div className="mt-8 rounded-3xl bg-slate-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Áudio da sessão
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Grave, armazene, reproduza e
                transcreva os áudios deste
                atendimento.
              </p>
            </div>

            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              {audios.length}{" "}
              {audios.length === 1
                ? "gravação"
                : "gravações"}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-800">
              Gravação do atendimento
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              O áudio é enviado para o
              armazenamento privado do
              atendimento.
            </p>

            <div className="mt-6 flex flex-col items-center rounded-3xl bg-slate-50 p-6">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full ${
                  gravandoAudio
                    ? "bg-red-100"
                    : "bg-slate-200"
                }`}
              >
                <span className="text-4xl">
                  {gravandoAudio
                    ? "●"
                    : "🎙️"}
                </span>
              </div>

              <div className="mt-5 text-4xl font-bold tabular-nums text-slate-800">
                {formatarDuracao(
                  gravandoAudio &&
                    inicioGravacaoAudio
                    ? Math.floor(
                        (agora -
                          inicioGravacaoAudio) /
                          1000
                      )
                    : duracaoAudio
                )}
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {gravandoAudio
                  ? "Gravando..."
                  : audioBlob
                  ? "Gravação pronta"
                  : audioEnviado
                  ? "Áudio enviado"
                  : "Pronto para gravar"}
              </p>

              <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                {!gravandoAudio &&
                  !audioBlob &&
                  !audioEnviado && (
                    <button
                      type="button"
                      onClick={
                        iniciarGravacaoAudio
                      }
                      className="flex-1 rounded-2xl bg-red-600 px-6 py-4 font-bold text-white hover:bg-red-700"
                    >
                      🎙️ Iniciar gravação
                    </button>
                  )}

                {gravandoAudio && (
                  <button
                    type="button"
                    onClick={
                      pararGravacaoAudio
                    }
                    className="flex-1 rounded-2xl bg-slate-800 px-6 py-4 font-bold text-white hover:bg-slate-700"
                  >
                    ⏹️ Parar gravação
                  </button>
                )}

                {audioBlob &&
                  !gravandoAudio && (
                    <>
                      <button
                        type="button"
                        onClick={
                          descartarAudio
                        }
                        disabled={
                          processandoAudio
                        }
                        className="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Descartar
                      </button>

                      <button
                        type="button"
                        onClick={
                          enviarAudio
                        }
                        disabled={
                          processandoAudio
                        }
                        className="flex-1 rounded-2xl bg-green-600 px-6 py-4 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {processandoAudio
                          ? "Enviando..."
                          : "💾 Salvar áudio"}
                      </button>
                    </>
                  )}
              </div>

              {audioUrl &&
                !audioEnviado && (
                  <div className="mt-6 w-full max-w-xl rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="mb-3 text-sm font-semibold text-slate-700">
                      Pré-visualização
                    </p>

                    <audio
                      controls
                      src={audioUrl}
                      className="w-full"
                    />
                  </div>
                )}

              {mensagemAudio && (
                <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                  {mensagemAudio}
                </div>
              )}
            </div>
          </div>

          {/* LISTA DE ÁUDIOS */}
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Histórico de gravações
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Todos os áudios vinculados
                  exclusivamente a este
                  atendimento.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                Tempo total:{" "}
                {formatarDuracao(
                  duracaoTotalAudios
                )}
              </div>
            </div>

            {loadingAudios ? (
              <p className="mt-5 text-slate-500">
                Carregando áudios...
              </p>
            ) : audios.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-500">
                Nenhuma gravação salva
                neste atendimento.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {audios.map(
                  (audio, indice) => {
                    const transcricao =
                      audio.transcricao_editada ||
                      audio.transcricao ||
                      "";

                    const editando =
                      transcricaoEmEdicaoId ===
                      audio.id;

                    const transcrevendo =
                      transcrevendoAudioId ===
                      audio.id;

                    const salvando =
                      salvandoTranscricaoId ===
                      audio.id;

                    return (
                      <div
                        key={audio.id}
                        className="rounded-3xl border border-slate-200 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                Áudio #
                                {indice + 1}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  audio.status ===
                                  "transcrito"
                                    ? "bg-green-50 text-green-700"
                                    : audio.status ===
                                      "erro"
                                    ? "bg-red-50 text-red-700"
                                    : audio.status ===
                                      "transcrevendo"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {textoStatusAudio(
                                  audio.status
                                )}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1 text-sm text-slate-500">
                              <p>
                                <strong>
                                  Data:
                                </strong>{" "}
                                {new Date(
                                  audio.created_at
                                ).toLocaleString(
                                  "pt-BR"
                                )}
                              </p>

                              <p>
                                <strong>
                                  Duração:
                                </strong>{" "}
                                {formatarDuracao(
                                  audio.duracao_segundos ||
                                    0
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {audio.audio_url ? (
                          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                            <audio
                              controls
                              src={
                                audio.audio_url
                              }
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                            Não foi possível
                            gerar o acesso
                            temporário a este
                            áudio.
                          </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              transcreverAudio(
                                audio
                              )
                            }
                            disabled={
                              transcrevendo ||
                              salvando
                            }
                            className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {transcrevendo
                              ? "Transcrevendo..."
                              : audio.transcricao
                              ? "🔄 Transcrever novamente"
                              : "📝 Transcrever áudio"}
                          </button>

                          {transcricao && (
                            <button
                              type="button"
                              onClick={() =>
                                copiarTranscricao(
                                  transcricao
                                )
                              }
                              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              📋 Copiar
                            </button>
                          )}
                        </div>

                        {transcricao && (
                          <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="font-bold text-slate-800">
                                  Transcrição
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                  Revise o conteúdo
                                  antes de
                                  transformá-lo em
                                  registro do
                                  prontuário.
                                </p>
                              </div>

                              {!editando && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    iniciarEdicaoTranscricao(
                                      audio
                                    )
                                  }
                                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-600 ring-1 ring-slate-200 hover:bg-blue-50"
                                >
                                  ✏️ Editar
                                </button>
                              )}
                            </div>

                            {editando ? (
                              <div className="mt-4">
                                <textarea
                                  value={
                                    textoTranscricaoEdicao
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setTextoTranscricaoEdicao(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  rows={10}
                                  className="w-full resize-y rounded-2xl border border-blue-300 bg-white p-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      salvarTranscricao(
                                        audio
                                      )
                                    }
                                    disabled={
                                      salvando ||
                                      !textoTranscricaoEdicao.trim()
                                    }
                                    className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {salvando
                                      ? "Salvando..."
                                      : "Salvar transcrição"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelarEdicaoTranscricao
                                    }
                                    disabled={
                                      salvando
                                    }
                                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-slate-700 ring-1 ring-slate-200">
                                {transcricao}
                              </p>
                            )}

                            {!editando && (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    transformarTranscricaoEmRegistro(
                                      audio
                                    )
                                  }
                                  disabled={
                                    salvandoRegistro
                                  }
                                  className="w-full rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                                >
                                  {salvandoRegistro
                                    ? "Adicionando..."
                                    : "📝 Adicionar ao prontuário"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <strong>Privacidade:</strong>{" "}
            os áudios e transcrições podem
            conter informações sensíveis do
            paciente. Os arquivos são mantidos
            em armazenamento privado e o acesso
            é feito por autorização do painel.
          </div>
        </div>

        {/* PRONTUÁRIO */}
        <div className="mt-8 rounded-3xl bg-slate-50 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Registros do atendimento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organize as informações da
              consulta por categoria.
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
                value={
                  categoriaSelecionada
                }
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

            <div className="mt-2 text-right text-xs text-slate-400">
              {
                conteudoNovoRegistro.length
              }{" "}
              caracteres
            </div>

            <button
              type="button"
              onClick={
                salvarNovoRegistro
              }
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

          {/* BUSCA */}
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <label
              htmlFor="busca-registros"
              className="block text-sm font-semibold text-slate-700"
            >
              Buscar no prontuário
            </label>

            <input
              id="busca-registros"
              type="text"
              value={buscaRegistros}
              onChange={(event) =>
                setBuscaRegistros(
                  event.target.value
                )
              }
              placeholder="Pesquisar por palavra ou categoria..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800">
                Histórico de registros
              </h3>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {
                  registrosFiltrados.length
                }{" "}
                {registrosFiltrados.length ===
                1
                  ? "registro"
                  : "registros"}
              </span>
            </div>

            {loadingRegistros ? (
              <p className="mt-5 text-slate-500">
                Carregando registros...
              </p>
            ) : registros.length ===
              0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-slate-500">
                Nenhum registro salvo
                ainda.
              </p>
            ) : registrosFiltrados.length ===
              0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-slate-500">
                Nenhum registro
                corresponde à busca.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {registrosFiltrados.map(
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
                              value={
                                textoEdicao
                              }
                              onChange={(
                                event
                              ) =>
                                setTextoEdicao(
                                  event
                                    .target
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
          <strong>Privacidade:</strong>{" "}
          estes registros, áudios e
          transcrições podem conter
          informações sensíveis do paciente.
          Mantenha o acesso ao painel restrito
          e não compartilhe essas informações
          fora do ambiente autorizado.
        </div>
      </div>
    </div>
  );
}


