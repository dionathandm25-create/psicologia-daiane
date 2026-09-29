export default function Home() {
  const servicos = [
    {
      titulo: "Consulta inicial",
      descricao: "Atendimento inicial com avaliação clínica.",
      preco: "Consulte valores",
    },
    {
      titulo: "Consulta sessão",
      descricao: "Sessão individual de acompanhamento.",
      preco: "Consulte valores",
    },
    {
      titulo: "Avaliação Neuropsicológica",
      descricao: "Avaliação para TDAH, TEA e QI.",
      preco: "Consulte valores",
    },
    {
      titulo: "Laudos para cirurgias",
      descricao:
        "Laudos para cirurgia bariátrica, vasectomia e entre outras cirurgias.",
      preco: "Consulte valores",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-slate-200 bg-white/90 px-6 py-5 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/"
            className="text-xl font-bold text-slate-800"
          >
            Dra. Daiane Damasceno
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm font-semibold text-slate-600">
            <a
              href="/"
              className="transition hover:text-slate-900"
            >
              Home
            </a>

            <a
              href="/servicos"
              className="transition hover:text-slate-900"
            >
              Serviços
            </a>

            <a
              href="/agendar"
              className="transition hover:text-slate-900"
            >
              Agendar
            </a>

            <a
              href="/contato"
              className="transition hover:text-slate-900"
            >
              Contato
            </a>

            <a
              href="/login"
              className="rounded-xl bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              Entrar
            </a>
          </nav>
        </div>
      </header>

      <main className="px-6 py-16">
        <section className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-bold leading-tight text-slate-800 sm:text-5xl">
            Realize seu agendamento on-line abaixo
          </h1>

          <p className="mt-6 text-xl text-slate-600 sm:text-2xl">
            Psicóloga Clínica | Psicanalista | Neuropsicóloga
          </p>

          <p className="mt-3 text-lg text-slate-500">
            CRP: 12/29150
          </p>

          <div className="mt-10">
            <a
              href="/agendar"
              className="inline-flex rounded-2xl bg-slate-800 px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-slate-700"
            >
              Agendar Consulta
            </a>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-6xl">
          <h2 className="text-center text-4xl font-bold text-slate-800">
            Serviços
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {servicos.map((servico) => (
              <div
                key={servico.titulo}
                className="rounded-2xl bg-white p-8 shadow-md"
              >
                <h3 className="text-2xl font-semibold text-slate-800">
                  {servico.titulo}
                </h3>

                <p className="mt-3 text-slate-600">
                  {servico.descricao}
                </p>

                <p className="mt-4 text-lg font-bold text-slate-800">
                  {servico.preco}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
