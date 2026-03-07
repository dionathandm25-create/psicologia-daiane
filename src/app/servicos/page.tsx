export default function ServicosPage() {
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
      titulo: "Laudos neuropsicológicos",
      descricao: "Emissão de laudos profissionais.",
      preco: "Consulte valores",
    },
    {
      titulo: "Aplicação ABA",
      descricao: "Aplicação de análise do comportamento.",
      preco: "Consulte valores",
    },
    {
      titulo: "Pacote sessões ABA",
      descricao: "Pacote com valor reduzido para acompanhamento.",
      preco: "Consulte valores",
    },
    {
      titulo: "Laudos de cirurgia bariátrica, vasectomia e entre outras cirurgias",
      descricao: "Laudos e documentação para procedimentos cirúrgicos, com atendimento profissional e acompanhamento adequado.",
      preco: "Consulte valores",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-slate-800">
          Serviços
        </h1>
        <p className="mt-4 text-slate-600">
          Conheça os serviços oferecidos pela Dra. Daiane Damasceno
        </p>
        <p className="mt-2 text-slate-500">
          Psicóloga Clínica | Neuropsicologia | Psicanalista
        </p>
        <p className="mt-1 text-slate-500">
          CRP: 12/29150
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {servicos.map((servico, index) => (
          <div
            key={index}
            className="rounded-2xl bg-white p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-slate-800">
              {servico.titulo}
            </h2>

            <p className="mt-2 text-slate-600">
              {servico.descricao}
            </p>

            <p className="mt-4 text-lg font-bold text-slate-800">
              {servico.preco}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <a
          href="/agendar"
          className="inline-block rounded-xl bg-slate-800 px-8 py-4 text-lg font-semibold text-white"
        >
          Agendar Consulta
        </a>
      </div>
    </div>
  );
}
