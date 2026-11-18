export default function DashboardPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-4xl">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
          Transformação Saúde
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
          {title}
        </h1>
      </header>

      <section className="mt-6 rounded-3xl border border-dashed border-[#d9bd8f] bg-white/90 p-6 shadow-[0_12px_30px_rgba(87,35,39,0.08)] sm:p-8">
        <p className="text-lg font-semibold text-[#572936]">
          Indisponível nesta etapa
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71545a]">
          {description}
        </p>
        <p className="mt-4 text-xs leading-5 text-[#81736d]">
          Nenhum dado ou ação foi simulado.
        </p>
      </section>
    </main>
  );
}
