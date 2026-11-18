"use client";

import { useEffect, useState } from "react";

export type Paciente = {
  id: number;
  nome: string;
  nome_social: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
};

export type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  created_at: string;
  payment_status: string | null;
  atendimento_status: string | null;
  paciente_id: number;
};

export default function usePatientPortalData({
  includeProfile = true,
  includeAppointments = true,
}: {
  includeProfile?: boolean;
  includeAppointments?: boolean;
} = {}) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregandoPaciente, setCarregandoPaciente] =
    useState(includeProfile);
  const [carregandoAgendamentos, setCarregandoAgendamentos] =
    useState(includeAppointments);
  const [erroPaciente, setErroPaciente] = useState("");
  const [erroAgendamentos, setErroAgendamentos] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const resposta = await fetch("/api/paciente/me", {
          cache: "no-store",
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error || "Não foi possível carregar seu perfil."
          );
        }

        if (ativo) {
          setPaciente(dados.paciente);
          setErroPaciente("");
        }
      } catch (error) {
        if (!ativo) return;
        console.error("Erro ao carregar perfil do paciente:", error);
        setErroPaciente(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seu perfil."
        );
      } finally {
        if (ativo) setCarregandoPaciente(false);
      }
    }

    async function carregarAgendamentos() {
      try {
        const resposta = await fetch("/api/paciente/agendamentos", {
          cache: "no-store",
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error || "Não foi possível carregar suas consultas."
          );
        }

        if (ativo) {
          setAgendamentos(dados.agendamentos || []);
          setErroAgendamentos("");
        }
      } catch (error) {
        if (!ativo) return;
        console.error("Erro ao carregar consultas do paciente:", error);
        setErroAgendamentos(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar suas consultas."
        );
      } finally {
        if (ativo) setCarregandoAgendamentos(false);
      }
    }

    if (includeProfile) void carregarPerfil();
    if (includeAppointments) void carregarAgendamentos();

    return () => {
      ativo = false;
    };
  }, [includeAppointments, includeProfile]);

  return {
    paciente,
    agendamentos,
    carregandoPaciente,
    carregandoAgendamentos,
    erroPaciente,
    erroAgendamentos,
  };
}
