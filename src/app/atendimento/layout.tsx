import DashboardShell from "@/components/dashboard/DashboardShell";
import { NAVEGACAO_ADMIN } from "@/components/dashboard/navigation";

export default function AtendimentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell area="admin" navigation={NAVEGACAO_ADMIN}>
      {children}
    </DashboardShell>
  );
}
