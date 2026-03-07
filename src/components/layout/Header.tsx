import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-pink-100 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/logo-daiane.png"
            alt="Logo Dra. Daiane Damasceno"
            width={58}
            height={58}
            className="rounded-full object-cover"
          />

          <h1 className="text-center text-2xl font-bold leading-none text-slate-800 sm:text-3xl">
            Dra. Daiane Damasceno
          </h1>
        </div>

        <nav className="mt-4 flex flex-wrap items-center justify-center gap-6 text-base font-medium text-slate-700">
          <Link href="/">Home</Link>
          <Link href="/servicos">Serviços</Link>
          <Link href="/agendar">Agendar</Link>
          <Link href="/contato">Contato</Link>
        </nav>
      </div>
    </header>
  );
}
