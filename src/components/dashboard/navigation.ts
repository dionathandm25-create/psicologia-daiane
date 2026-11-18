import type { DashboardNavigationItem } from "./DashboardShell";

export const NAVEGACAO_ADMIN: DashboardNavigationItem[] = [
  { label: "Visão geral", href: "/admin" },
  { label: "Agenda", href: "/admin/agenda" },
  { label: "Consultas", href: "/admin/consultas" },
  { label: "Pacientes", href: "/admin/pacientes" },
  { label: "Atendimentos", href: "/admin/atendimentos" },
  { label: "Financeiro", href: "/admin/financeiro" },
  { label: "Suporte", href: "/admin/suporte" },
  { label: "Perfil profissional", href: "/admin/perfil-profissional" },
  { label: "Verificações", href: "/admin/verificacoes" },
];

export const NAVEGACAO_PACIENTE: DashboardNavigationItem[] = [
  { label: "Início", href: "/paciente" },
  { label: "Meu perfil", href: "/paciente/perfil" },
  { label: "Minhas consultas", href: "/paciente/consultas" },
  { label: "Histórico", href: "/paciente/historico" },
  { label: "Pagamentos", href: "/paciente/pagamentos" },
  { label: "Suporte", href: "/paciente/suporte" },
  { label: "Verificação", href: "/paciente/verificacao" },
];
