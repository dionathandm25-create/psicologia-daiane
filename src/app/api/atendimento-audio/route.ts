import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN =
  "contatocomercial.dionathandev@gmail.com";

const BUCKET_AUDIO =
  "audios-atendimento";

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

/**
 * LISTAR TODOS OS ÁUDIOS DO ATENDIMENTO
 *
 * O bucket continua privado.
 * Para tocar o áudio no navegador,
 * geramos uma URL assinada temporária.
 */
export async function GET(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
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
            "ID do atendimento inválido.",
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
            "Atendimento não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Busca TODOS os áudios vinculados
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
        "ERRO AO BUSCAR ÁUDIOS:",
        audiosError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os áudios.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Para cada áudio privado,
     * criamos uma URL temporária.
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
                "ERRO AO GERAR URL DO ÁUDIO:",
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
      "ERRO GET ÁUDIOS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar os áudios.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ENVIAR NOVO ÁUDIO
 */
export async function POST(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
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
            "ID do atendimento inválido.",
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
            "Nenhum arquivo de áudio foi enviado.",
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
            "O arquivo de áudio está vazio.",
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
            "O arquivo de áudio ultrapassa o limite de 50 MB.",
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
            "Duração do áudio inválida.",
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
            "Atendimento não encontrado.",
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
        "ERRO AO ENVIAR ÁUDIO PARA O STORAGE:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível armazenar o áudio.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Registra o áudio no banco.
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
        "ERRO AO REGISTRAR ÁUDIO:",
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
            "O áudio foi enviado, mas não foi possível registrar os dados.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Já devolvemos uma URL temporária
     * para o áudio recém-criado.
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
      "ERRO POST ÁUDIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao enviar o áudio.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * EDITAR A TRANSCRIÇÃO REVISADA
 */
export async function PUT(
  request: Request
) {
  try {
    if (!(await verificarAdmin())) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
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
            "ID do atendimento inválido.",
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
            "ID do áudio inválido.",
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
            "A transcrição revisada não pode ficar vazia.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      criarAdminClient();

    /*
     * O áudio precisa pertencer
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
            "Áudio não encontrado para este atendimento.",
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
        "ERRO AO SALVAR TRANSCRIÇÃO EDITADA:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível salvar a transcrição revisada.",
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
      "ERRO PUT ÁUDIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao salvar a transcrição revisada.",
      },
      {
        status: 500,
      }
    );
  }
}
