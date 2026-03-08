export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
        <h1 className="text-4xl font-bold text-slate-800">
          Agendamento confirmado
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          Seu horário foi registrado com sucesso.
        </p>

        <p className="mt-3 text-slate-500">
          Em breve você poderá receber confirmação automática por e-mail e também por WhatsApp.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para o início
          </a>

          <a
            href="/admin"
            className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
          >
            Ir para painel
          </a>
        </div>
      </div>
    </div>
  );
}
