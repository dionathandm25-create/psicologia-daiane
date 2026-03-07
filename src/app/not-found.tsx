export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Erro 404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-800">
          Página não encontrada
        </h1>
        <p className="mt-4 text-slate-600">
          A página que você tentou acessar não existe ou foi movida.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
        >
          Voltar para a home
        </a>
      </div>
    </div>
  );
}
