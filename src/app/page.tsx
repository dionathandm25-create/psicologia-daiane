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
              className="brand-action inline-flex rounded-2xl px-10 py-4 text-lg font-semibold"
            >
              Agendar Consulta
            </a>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-6xl">
          <h2 className="text-center text-4xl font-bold text-slate-800">
            Serviços
          </h2>

          <div className="brand-card-grid mt-12 grid gap-8 md:grid-cols-2">
            {servicos.map((servico) => (
              <div
                key={servico.titulo}
                className="brand-card rounded-2xl p-8"
              >
                <h3 className="text-2xl font-semibold text-[#640219]">
                  {servico.titulo}
                </h3>

                <p className="mt-3 text-slate-600">
                  {servico.descricao}
                </p>

                <p className="mt-4 text-lg font-bold text-[#640219]">
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
