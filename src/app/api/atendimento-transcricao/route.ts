import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN =
  "contatocomercial.dionathandev@gmail.com";

const BUCKET_AUDIO =
  "audios-atendimento";

function criarOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
  });
}

function criarAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase no servidor não encontrada."
    );
  }

  return createAdminClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function verificarAdmin() {
  const supabase =
    await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !user ||
    user.email?.toLowerCase() !==
      EMAIL_ADMIN
  ) {
    return false;
  }

  return true;
}

export async function POST(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error:
            "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const atendimentoId =
      Number(
        body?.atendimento_id
      );

    const audioId =
      Number(
        body?.audio_id
      );

    if (
      !Number.isInteger(
        atendimentoId
      ) ||
      atendimentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível processar a solicitação.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        audioId
      ) ||
      audioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível processar a solicitação.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      criarAdminClient();

    const {
      data: audio,
      error: audioError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .select(
          `
            id,
            atendimento_id,
            storage_path,
            status
          `
        )
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        )
        .single();

    if (
      audioError ||
      !audio
    ) {
      return NextResponse.json(
        {
          error:
            "Áudio não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      audio.status ===
      "transcrevendo"
    ) {
      return NextResponse.json(
        {
          error:
            "A transcrição deste áudio já está sendo processada.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Baixa o áudio privado
     * diretamente do Storage.
     */
    const {
      data: arquivo,
      error: downloadError,
    } =
      await supabase.storage
        .from(
          BUCKET_AUDIO
        )
        .download(
          audio.storage_path
        );

    if (
      downloadError ||
      !arquivo
    ) {
      console.error(
        "ERRO AO BAIXAR ÁUDIO:",
        downloadError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível acessar o áudio armazenado.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Marca como transcrevendo.
     */
    const {
      error:
        statusError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "transcrevendo",
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

    if (statusError) {
      console.error(
        "ERRO AO ATUALIZAR STATUS:",
        statusError
      );
    }

    const nomeArquivo =
      audio.storage_path
        .split("/")
        .pop() ||
      "audio.webm";

    const arquivoParaOpenAI =
      new File(
        [
          await arquivo.arrayBuffer(),
        ],
        nomeArquivo,
        {
          type:
            arquivo.type ||
            "audio/webm",
        }
      );

    const openai =
      criarOpenAI();

    if (!openai) {
      console.error(
        "OPENAI_API_KEY não configurada."
      );

      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "enviado",
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir a transcrição no momento. O áudio continua salvo com segurança e poderá ser transcrito posteriormente.",
        },
        {
          status: 503,
        }
      );
    }

    let resultado;

    try {
      /*
       * Envia o áudio para a
       * transcrição automática.
       */
      resultado =
        await openai.audio.transcriptions.create(
          {
            file:
              arquivoParaOpenAI,
            model:
              "gpt-4o-mini-transcribe",
            language:
              "pt",
          }
        );
    } catch (error) {
      /*
       * O erro técnico fica somente
       * no servidor/terminal.
       *
       * O usuário nunca recebe:
       * API key
       * 429
       * OpenAI
       * insufficient_quota
       * stack trace
       * ou outros detalhes técnicos.
       */
      console.error(
        "ERRO AO SOLICITAR TRANSCRIÇÃO:",
        error
      );

      /*
       * Libera o áudio para uma
       * nova tentativa posteriormente.
       */
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "enviado",
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir a transcrição no momento. O áudio continua salvo com segurança e poderá ser transcrito posteriormente.",
        },
        {
          status: 503,
        }
      );
    }

    const transcricao =
      resultado.text?.trim();

    if (!transcricao) {
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "enviado",
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir a transcrição no momento. O áudio continua salvo com segurança e poderá ser transcrito posteriormente.",
        },
        {
          status: 503,
        }
      );
    }

    /*
     * Salva a transcrição original.
     */
    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "transcrito",
          transcricao:
            transcricao,
          transcricao_em:
            new Date().toISOString(),
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

    if (updateError) {
      console.error(
        "ERRO AO SALVAR TRANSCRIÇÃO:",
        updateError
      );

      /*
       * A transcrição foi realizada,
       * mas não conseguimos salvá-la.
       */
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          status:
            "enviado",
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        );

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir a transcrição no momento. O áudio continua salvo com segurança e poderá ser transcrito posteriormente.",
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        sucesso:
          true,
        audio_id:
          audioId,
        atendimento_id:
          atendimentoId,
        transcricao:
          transcricao,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
     * Erro técnico completo somente
     * no servidor.
     */
    console.error(
      "ERRO INTERNO NA TRANSCRIÇÃO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível concluir a transcrição no momento. O áudio continua salvo com segurança e poderá ser transcrito posteriormente.",
      },
      {
        status: 503,
      }
    );
  }
}
