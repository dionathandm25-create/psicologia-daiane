export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white/90 p-8 shadow-md backdrop-blur-sm">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-slate-800">Contato</h1>
            <p className="mt-4 text-lg text-slate-600">
              Entre em contato para tirar dúvidas ou iniciar seu agendamento.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800">WhatsApp</h2>
              <p className="mt-3 text-slate-600">
                Atendimento rápido para dúvidas e confirmação de consultas.
              </p>
              <a
                href="https://wa.me/5547999999999?text=Olá! Quero agendar uma consulta."
                target="_blank"
                className="mt-6 inline-flex rounded-xl bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800">Agendamento</h2>
              <p className="mt-3 text-slate-600">
                Faça seu agendamento online com praticidade.
              </p>
              <a
                href="/agendar"
                className="mt-6 inline-flex rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
              >
                Ir para agendamento
              </a>
            </div>

            <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800">Endereço</h2>
              <p className="mt-3 text-slate-600">
                Espaço reservado para endereço futuro da clínica.
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800">E-mail</h2>
              <p className="mt-3 text-slate-600">
                Espaço reservado para e-mail profissional futuro.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
