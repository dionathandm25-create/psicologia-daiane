"use client";

import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function CadastroPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Criar cadastro
          </h1>

          <p className="mt-3 text-slate-600">
            Crie sua conta para acessar sua área de paciente.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <GoogleLoginButton />
        </div>

        <div className="mt-8 rounded-2xl bg-rose-50 p-4 text-sm text-slate-600">
          <p>
            Sua conta será vinculada aos seus dados de paciente e aos
            seus agendamentos.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="text-sm font-semibold text-pink-600 hover:text-pink-700"
          >
            Já possui uma conta? Entrar
          </a>
        </div>

        <div className="mt-4 text-center">
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
