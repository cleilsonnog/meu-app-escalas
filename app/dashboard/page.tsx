import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EscalaCard } from "@/components/ui/dashboard/escala-card";
import { NovaEscalaModal } from "@/components/ui/dashboard/nova-escala-modal";
import { NovoVoluntarioModal } from "@/components/ui/dashboard/novo-voluntario-modal";
import { ListaEscalasFiltrada } from "@/components/ui/dashboard/lista-escalas-filtrada";
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
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <header className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        {/* Linha 1 e 2: Título, Descrição e Avatar no Mobile */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Painel de Gestão
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie cultos, escalas e voluntários do seu ministério.
            </p>
          </div>

          {/* Avatar do Usuário (Mobile) */}
          <div className="md:hidden shrink-0 pt-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Linha 3: Botões de Ação ocupando 100% da largura no Mobile */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <NovoVoluntarioModal />
          </div>
          <div className="flex-1 md:flex-initial">
            <NovaEscalaModal voluntarios={listaVoluntarios} />
          </div>

          {/* Avatar do Usuário (Desktop) */}
          <div className="hidden md:block shrink-0 ml-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main>
        <DashboardTabs escalas={listaEscalas} voluntarios={listaVoluntarios} />
      </main>
    </div>
  );
}
