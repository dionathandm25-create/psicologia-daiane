"use client";

import { useCallback, useEffect, useState } from "react";

export type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  created_at: string;
  payment_status?: string | null;
  atendimento_status?: string | null;
};

export default function useAdminAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAgendamentos = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch("/api/admin/agendamentos", {
        method: "GET",
        cache: "no-store",
      });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(
          resultado?.error || "Não foi possível carregar os agendamentos."
        );
        return;
      }

      setAgendamentos(resultado.agendamentos || []);
    } catch (error) {
      console.error("Falha ao carregar agendamentos administrativos:", error);
      setErro("Ocorreu um erro ao carregar os agendamentos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarAgendamentos();
  }, [carregarAgendamentos]);

  const removerAgendamento = useCallback(async (id: number) => {
    setErro("");

    try {
      const resposta = await fetch("/api/admin/agendamentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(
          resultado?.error || "Não foi possível cancelar a consulta."
        );
        return false;
      }

      setAgendamentos((atuais) => atuais.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Falha ao cancelar agendamento:", error);
      setErro("Ocorreu um erro ao cancelar a consulta.");
      return false;
    }
  }, []);

  return {
    agendamentos,
    carregando,
    erro,
    carregarAgendamentos,
    removerAgendamento,
  };
}
