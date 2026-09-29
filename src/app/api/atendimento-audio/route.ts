import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN =
  "psi.daianedamasceno@gmail.com";

const BUCKET_AUDIO =
  "audios-atendimento";

function criarAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "ConfiguraÃ§Ã£o do Supabase no servidor nÃ£o encontrada."
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

/**
 * LISTAR TODOS OS ÃUDIOS DO ATENDIMENTO
 *
 * O bucket continua privado.
 * Para tocar o Ã¡udio no navegador,
 * geramos uma URL assinada temporÃ¡ria.
 */
export async function GET(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "NÃ£o autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const atendimentoId =
      Number(
        searchParams.get(
          "atendimento_id"
        )
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
            "ID do atendimento invÃ¡lido.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      criarAdminClient();

    /*
     * Primeiro confirmamos que o atendimento existe.
     */
    const {
      data: agendamento,
      error:
        agendamentoError,
    } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("id", atendimentoId)
      .single();

    if (
      agendamentoError ||
      !agendamento
    ) {
      return NextResponse.json(
        {
          error:
            "Atendimento nÃ£o encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Busca TODOS os Ã¡udios vinculados
     * exclusivamente a este atendimento.
     */
    const {
      data: audios,
      error: audiosError,
    } = await supabase
      .from("atendimento_audios")
      .select(
        `
          id,
          created_at,
          atendimento_id,
          storage_path,
          duracao_segundos,
          status,
          transcricao,
          transcricao_editada,
          transcricao_em
        `
      )
      .eq(
        "atendimento_id",
        atendimentoId
      )
      .order("created_at", {
        ascending: true,
      });

    if (audiosError) {
      console.error(
        "ERRO AO BUSCAR ÃUDIOS:",
        audiosError
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel carregar os Ã¡udios.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Para cada Ã¡udio privado,
     * criamos uma URL temporÃ¡ria.
     *
     * 1 hora de validade.
     */
    const audiosComUrl =
      await Promise.all(
        (audios || []).map(
          async (audio) => {
            const {
              data:
                signedUrlData,
              error:
                signedUrlError,
            } =
              await supabase.storage
                .from(
                  BUCKET_AUDIO
                )
                .createSignedUrl(
                  audio.storage_path,
                  60 * 60
                );

            if (
              signedUrlError
            ) {
              console.error(
                "ERRO AO GERAR URL DO ÃUDIO:",
                signedUrlError
              );
            }

            return {
              ...audio,
              audio_url:
                signedUrlData
                  ?.signedUrl ||
                null,
            };
          }
        )
      );

    return NextResponse.json({
      audios:
        audiosComUrl,
    });
  } catch (error) {
    console.error(
      "ERRO GET ÃUDIOS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar os Ã¡udios.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ENVIAR NOVO ÃUDIO
 */
export async function POST(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "NÃ£o autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const formData =
      await request.formData();

    const atendimentoIdValue =
      formData.get(
        "atendimento_id"
      );

    const arquivo =
      formData.get("arquivo");

    const duracaoValue =
      formData.get(
        "duracao_segundos"
      );

    const atendimentoId =
      Number(
        atendimentoIdValue
      );

    const duracaoSegundos =
      duracaoValue !== null
        ? Number(duracaoValue)
        : null;

    if (
      !Number.isInteger(
        atendimentoId
      ) ||
      atendimentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do atendimento invÃ¡lido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !(arquivo instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Nenhum arquivo de Ã¡udio foi enviado.",
        },
        {
          status: 400,
        }
      );
    }

    if (arquivo.size <= 0) {
      return NextResponse.json(
        {
          error:
            "O arquivo de Ã¡udio estÃ¡ vazio.",
        },
        {
          status: 400,
        }
      );
    }

    const LIMITE_AUDIO =
      50 * 1024 * 1024;

    if (
      arquivo.size >
      LIMITE_AUDIO
    ) {
      return NextResponse.json(
        {
          error:
            "O arquivo de Ã¡udio ultrapassa o limite de 50 MB.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      duracaoValue !== null &&
      (
        !Number.isFinite(
          duracaoSegundos
        ) ||
        (duracaoSegundos ??
          0) < 0
      )
    ) {
      return NextResponse.json(
        {
          error:
            "DuraÃ§Ã£o do Ã¡udio invÃ¡lida.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      criarAdminClient();

    /*
     * Confirma o atendimento.
     */
    const {
      data: agendamento,
      error:
        agendamentoError,
    } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("id", atendimentoId)
      .single();

    if (
      agendamentoError ||
      !agendamento
    ) {
      return NextResponse.json(
        {
          error:
            "Atendimento nÃ£o encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const extensaoOriginal =
      arquivo.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "webm";

    const extensoesPermitidas =
      [
        "webm",
        "mp4",
        "m4a",
        "mp3",
        "ogg",
        "wav",
      ];

    const extensao =
      extensoesPermitidas.includes(
        extensaoOriginal
      )
        ? extensaoOriginal
        : "webm";

    const nomeArquivo =
      `${crypto.randomUUID()}.${extensao}`;

    const storagePath =
      `atendimento-${atendimentoId}/${nomeArquivo}`;

    const arrayBuffer =
      await arquivo.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(BUCKET_AUDIO)
        .upload(
          storagePath,
          buffer,
          {
            contentType:
              arquivo.type ||
              "audio/webm",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "ERRO AO ENVIAR ÃUDIO PARA O STORAGE:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel armazenar o Ã¡udio.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Registra o Ã¡udio no banco.
     */
    const {
      data: registroAudio,
      error: registroError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .insert({
          atendimento_id:
            atendimentoId,
          storage_path:
            storagePath,
          duracao_segundos:
            duracaoSegundos,
          status: "enviado",
        })
        .select(
          `
            id,
            created_at,
            atendimento_id,
            storage_path,
            duracao_segundos,
            status,
            transcricao,
            transcricao_editada,
            transcricao_em
          `
        )
        .single();

    if (registroError) {
      console.error(
        "ERRO AO REGISTRAR ÃUDIO:",
        registroError
      );

      /*
       * Se o banco falhar,
       * removemos o arquivo que acabou
       * de ser enviado.
       */
      await supabase.storage
        .from(BUCKET_AUDIO)
        .remove([
          storagePath,
        ]);

      return NextResponse.json(
        {
          error:
            "O Ã¡udio foi enviado, mas nÃ£o foi possÃ­vel registrar os dados.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * JÃ¡ devolvemos uma URL temporÃ¡ria
     * para o Ã¡udio recÃ©m-criado.
     */
    const {
      data:
        signedUrlData,
    } =
      await supabase.storage
        .from(BUCKET_AUDIO)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

    return NextResponse.json(
      {
        sucesso: true,
        audio: {
          ...registroAudio,
          audio_url:
            signedUrlData
              ?.signedUrl ||
            null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ERRO POST ÃUDIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao enviar o Ã¡udio.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * EDITAR A TRANSCRIÃ‡ÃƒO REVISADA
 */
export async function PUT(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "NÃ£o autorizado.",
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
      Number(body?.audio_id);

    const transcricaoEditada =
      typeof body?.transcricao_editada ===
      "string"
        ? body.transcricao_editada.trim()
        : "";

    if (
      !Number.isInteger(
        atendimentoId
      ) ||
      atendimentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do atendimento invÃ¡lido.",
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
            "ID do Ã¡udio invÃ¡lido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!transcricaoEditada) {
      return NextResponse.json(
        {
          error:
            "A transcriÃ§Ã£o revisada nÃ£o pode ficar vazia.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      criarAdminClient();

    /*
     * O Ã¡udio precisa pertencer
     * exatamente ao atendimento informado.
     */
    const {
      data: audio,
      error: audioError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .select(
          "id, atendimento_id"
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
            "Ãudio nÃ£o encontrado para este atendimento.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data:
        audioAtualizado,
      error:
        updateError,
    } =
      await supabase
        .from(
          "atendimento_audios"
        )
        .update({
          transcricao_editada:
            transcricaoEditada,
        })
        .eq(
          "id",
          audioId
        )
        .eq(
          "atendimento_id",
          atendimentoId
        )
        .select(
          `
            id,
            created_at,
            atendimento_id,
            storage_path,
            duracao_segundos,
            status,
            transcricao,
            transcricao_editada,
            transcricao_em
          `
        )
        .single();

    if (updateError) {
      console.error(
        "ERRO AO SALVAR TRANSCRIÃ‡ÃƒO EDITADA:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "NÃ£o foi possÃ­vel salvar a transcriÃ§Ã£o revisada.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      sucesso: true,
      audio:
        audioAtualizado,
    });
  } catch (error) {
    console.error(
      "ERRO PUT ÃUDIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao salvar a transcriÃ§Ã£o revisada.",
      },
      {
        status: 500,
      }
    );
  }
}

