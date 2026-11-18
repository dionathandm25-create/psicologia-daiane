"use client";

import AdminAppointmentList from "../_components/AdminAppointmentList";
import useAdminAgendamentos, {
  type Agendamento,
} from "../_components/useAdminAgendamentos";

export default function ConsultasAdminPage() {
  const {
    agendamentos,
    carregando,
    erro,
    removerAgendamento,
  } = useAdminAgendamentos();

  async function cancelarAgendamento(agendamento: Agendamento) {
    const confirmar = window.confirm(
      "Deseja realmente cancelar esta consulta?"
    );
    if (!confirmar) return;

    const removido = await removerAgendamento(agendamento.id);
    if (removido) window.alert("Consulta cancelada com sucesso.");
  }

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
          Registros dos pacientes
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
          Consultas
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#71545a]">
          Agendamentos registrados, com acesso ao fluxo de atendimento existente.
        </p>
      </header>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <div role="status" className="rounded-3xl bg-white/90 p-6 text-sm text-[#71545a]">
          Carregando consultas...
        </div>
      ) : erro ? null : (
        <AdminAppointmentList
          agendamentos={agendamentos}
          onCancel={cancelarAgendamento}
        />
      )}
    </main>
  );
}
