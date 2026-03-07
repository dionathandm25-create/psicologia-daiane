export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-3xl bg-white px-8 py-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded-full bg-slate-800" />
          <p className="text-sm font-medium text-slate-700">Carregando página...</p>
        </div>
      </div>
    </div>
  );
}
