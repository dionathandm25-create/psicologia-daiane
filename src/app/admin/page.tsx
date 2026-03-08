"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  servico: string;
  data: string;
  horario: string;
  created_at: string;
  payment_status?: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState("");
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [erro, setErro] = useState("");

  async function carregarAgendamentos() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      setErro("Você entrou, mas não foi possível carregar os agendamentos.");
    } else {
      setAgendamentos(data || []);
      setErro("");
    }
  }

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        setLogado(false);
        return;
      }

      setLogado(true);
      setEmail(session.user.email || "");

      await carregarAgendamentos();
      setLoading(false);
    }

    carregar();
  }, []);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function cancelarAgendamento(id: number) {
    const supabase = createClient();

    const confirmar = window.confirm("Deseja realmente cancelar esta consulta?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao cancelar consulta.");
      return;
    }

    setAgendamentos((listaAtual) => listaAtual.filter((item) => item.id !== id));
    alert("Consulta cancelada com sucesso.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <p className="text-slate-700">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <h1 className="text-3xl font-bold text-slate-800">Painel da Dra.</h1>
          <p className="mt-4 text-slate-600">
            Entre com o Google autorizado para ver a agenda.
          </p>

          <div className="mt-8 flex justify-center">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white/90 p-8 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Painel da Dra.</h1>
            <p className="mt-2 text-slate-600">Logada como: {email}</p>
          </div>

          <button
            onClick={sair}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Sair
          </button>
        </div>

        {erro && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            {erro}
          </div>
        )}

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full rounded-2xl bg-white">
            <thead>
              <tr className="border-b text-left text-slate-800">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Horário</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>

            <tbody>
              {agendamentos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                agendamentos.map((item) => (
                  <tr key={item.id} className="border-b text-slate-700">
                    <td className="px-4 py-3">{item.nome}</td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">{item.telefone}</td>
                    <td className="px-4 py-3">{item.servico}</td>
                    <td className="px-4 py-3">{item.data}</td>
                    <td className="px-4 py-3">{item.horario}</td>
                    <td className="px-4 py-3">{item.payment_status || "pendente"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => cancelarAgendamento(item.id)}
                        className="rounded-xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
