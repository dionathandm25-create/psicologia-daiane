const CATEGORIAS_SUPORTE = [
  {
    titulo: "Agendamentos",
    descricao: "Dúvidas sobre horários ou consultas",
    mensagem: "Olá! Preciso de ajuda com meu agendamento.",
  },
  {
    titulo: "Acesso à conta",
    descricao: "Ajuda com login ou acesso ao painel",
    mensagem: "Olá! Preciso de ajuda com o acesso à minha conta.",
  },
  {
    titulo: "Pagamentos",
    descricao: "Dúvidas sobre pagamentos",
    mensagem: "Olá! Preciso de ajuda com um pagamento.",
  },
  {
    titulo: "Outro assunto",
    descricao: "Fale com a equipe sobre outra dúvida",
    mensagem: "Olá! Preciso de ajuda com outro assunto.",
  },
];

export default function SuportePacientePage() {
  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
          Estamos à disposição
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
          Suporte
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71545a]">
          Escolha um assunto para iniciar uma conversa pelo WhatsApp.
        </p>
      </header>

      <section className="brand-card-grid grid gap-3 sm:grid-cols-2">
        {CATEGORIAS_SUPORTE.map((categoria) => (
          <a
            key={categoria.titulo}
            href={`https://wa.me/5547992479888?text=${encodeURIComponent(
              categoria.mensagem
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Falar com o suporte sobre ${categoria.titulo} pelo WhatsApp`}
            className="brand-card flex min-h-24 items-center justify-between gap-4 rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
          >
            <span>
              <span className="block font-bold text-[#572936]">
                {categoria.titulo}
              </span>
              <span className="mt-1 block text-sm text-[#81736d]">
                {categoria.descricao}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-xl text-[#9a6c38]">
              ↗
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
