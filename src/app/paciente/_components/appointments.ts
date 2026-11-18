import type { Agendamento } from "./usePatientPortalData";

export function getAppointmentDateTime(agendamento: Agendamento) {
  const data = agendamento.data?.slice(0, 10);
  const horario = agendamento.horario?.slice(0, 5);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data || "") ||
    !/^\d{2}:\d{2}$/.test(horario || "")
  ) {
    return null;
  }

  const dataHora = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dataHora.getTime()) ? null : dataHora;
}

export function isAppointmentClosed(agendamento: Agendamento) {
  const pagamento = agendamento.payment_status?.toLowerCase();
  const atendimento = agendamento.atendimento_status?.toLowerCase();

  return (
    pagamento === "rejected" ||
    pagamento === "cancelled" ||
    pagamento === "cancelado" ||
    atendimento === "finalizado" ||
    atendimento === "concluido" ||
    atendimento === "concluído"
  );
}

export function separateAppointments(agendamentos: Agendamento[]) {
  const agora = new Date();
  const proximas: Agendamento[] = [];
  const historico: Agendamento[] = [];

  for (const agendamento of agendamentos) {
    const dataHora = getAppointmentDateTime(agendamento);
    if (dataHora && dataHora >= agora && !isAppointmentClosed(agendamento)) {
      proximas.push(agendamento);
    } else {
      historico.push(agendamento);
    }
  }

  proximas.sort(
    (a, b) =>
      (getAppointmentDateTime(a)?.getTime() ?? 0) -
      (getAppointmentDateTime(b)?.getTime() ?? 0)
  );
  historico.sort(
    (a, b) =>
      (getAppointmentDateTime(b)?.getTime() ?? 0) -
      (getAppointmentDateTime(a)?.getTime() ?? 0)
  );

  return { proximas, historico };
}

export function formatarData(data: string) {
  if (!data) return "Data não informada";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export function formatarStatusPagamento(status: string | null) {
  switch (status) {
    case "approved":
      return "Pagamento aprovado";
    case "pending":
    case "pendente":
      return "Pagamento pendente";
    case "rejected":
    case "cancelled":
    case "cancelado":
      return "Pagamento não aprovado";
    default:
      return "Pagamento não informado";
  }
}

export function formatarStatusAtendimento(status: string | null) {
  switch (status) {
    case "aguardando":
    case null:
      return "Aguardando atendimento";
    case "em_andamento":
    case "em andamento":
      return "Atendimento em andamento";
    case "finalizado":
    case "concluido":
    case "concluído":
      return "Atendimento finalizado";
    default:
      return status;
  }
}
