import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NovaEscalaModal } from "@/components/ui/dashboard/nova-escala-modal";
import { NovoVoluntarioModal } from "@/components/ui/dashboard/novo-voluntario-modal";
import { DashboardTabs } from "@/components/ui/dashboard/dashboard-tabs";
import { getEscalas, getVoluntarios } from "@/app/actions/escalas";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ data: escalas }, { data: voluntarios }] = await Promise.all([
    getEscalas(),
    getVoluntarios(),
  ]);

  const listaEscalas = escalas || [];
  const listaVoluntarios = voluntarios || [];

  return (
    <div className="flex flex-col min-h-screen p-8 bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel de Gestão
          </h1>
          <p className="text-muted-foreground">
            Gerencie cultos, escalas e voluntários do seu ministério.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NovoVoluntarioModal />
          <NovaEscalaModal voluntarios={listaVoluntarios} />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main>
        <DashboardTabs escalas={listaEscalas} voluntarios={listaVoluntarios} />
      </main>
    </div>
  );
}
