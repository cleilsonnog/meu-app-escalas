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
    <div className="min-h-screen bg-slate-50 px-3 py-4 dark:bg-slate-950 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 border-b pb-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Painel de Escalas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Gerencie as funções e voluntários dos próximos cultos.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <NovoVoluntarioModal />
          <NovaEscalaModal voluntarios={listaVoluntarios} />
          <div className="ml-auto sm:ml-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl">
        <ListaEscalasFiltrada escalas={listaEscalas} />
        <h2 className="text-xl font-semibold mb-4">Escalas Agendadas</h2>

        {listaEscalas.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma escala cadastrada ainda. Cadastre um voluntário e depois
            clique em "Nova Escala".
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listaEscalas.map((escala) => (
              <EscalaCard
                key={escala.id}
                id={escala.id}
                nome={escala.volunteer.nome}
                telefone={escala.volunteer.telefone}
                eventoTitulo={escala.event.titulo}
                funcao={escala.funcaoEspecífica}
                dataHora={escala.event.dataHora.toISOString()}
                status={
                  escala.status === "CONFIRMADO"
                    ? "Confirmado"
                    : escala.status === "RECUSADO"
                      ? "Recusado"
                      : "Pendente"
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
