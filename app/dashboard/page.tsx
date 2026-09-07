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
    <div className="flex flex-col min-h-screen p-8 bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel de Escalas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as funções e voluntários dos próximos cultos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NovoVoluntarioModal />
          <NovaEscalaModal voluntarios={listaVoluntarios} />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main>
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
