import DashboardShell from "@/components/dashboard/DashboardShell";
import { NAVEGACAO_PACIENTE } from "@/components/dashboard/navigation";

export default function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell area="paciente" navigation={NAVEGACAO_PACIENTE}>
      {children}
    </DashboardShell>
  );
}
