import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const EMAIL_ADMIN = "contatocomercial.dionathandev@gmail.com";

const BUCKET_AUDIO = "audios-atendimento";

function criarAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase no servidor não encontrada."
    );
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verificarAdmin() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !user ||
    user.email?.toLowerCase() !== EMAIL_ADMIN
  ) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
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

    const formData = await request.formData();

    const atendimentoIdValue =
      formData.get("atendimento_id");

    const arquivo = formData.get("arquivo");

    const duracaoValue =
      formData.get("duracao_segundos");

    const atendimentoId = Number(
      atendimentoIdValue
    );

    const duracaoSegundos =
      duracaoValue !== null
        ? Number(duracaoValue)
        : null;

    if (
      !Number.isInteger(atendimentoId) ||
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

    if (!(arquivo instanceof File)) {
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

    if (arquivo.size > LIMITE_AUDIO) {
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
        !Number.isFinite(duracaoSegundos) ||
        (duracaoSegundos ?? 0) < 0
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

    const supabase = criarAdminClient();

    const {
      data: agendamento,
      error: agendamentoError,
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
        ?.toLowerCase() || "webm";

    const extensoesPermitidas = [
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

    const buffer = Buffer.from(
      arrayBuffer
    );

    const {
      error: uploadError,
    } = await supabase.storage
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

    const {
      data: registroAudio,
      error: registroError,
    } = await supabase
      .from("atendimento_audios")
      .insert({
        atendimento_id: atendimentoId,
        storage_path: storagePath,
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

    return NextResponse.json(
      {
        sucesso: true,
        audio: registroAudio,
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
