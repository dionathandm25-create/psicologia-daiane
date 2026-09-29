import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Entrar
          </h1>

          <p className="mt-3 text-slate-600">
            Entre na sua conta para acessar sua área.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <GoogleLoginButton />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Ainda não possui cadastro?
          </p>

          <a
            href="/cadastro"
            className="mt-2 inline-block font-semibold text-pink-600 hover:text-pink-700"
          >
            Criar cadastro
          </a>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Voltar para o início
          </a>
        </div>
      </section>
    </main>
  );
}
