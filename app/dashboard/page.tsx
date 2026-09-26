import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NovaEscalaModal } from "@/components/ui/dashboard/nova-escala-modal";
import { NovoVoluntarioModal } from "@/components/ui/dashboard/novo-voluntario-modal";
import { DashboardTabs } from "@/components/ui/dashboard/dashboard-tabs";
import { getEscalas, getVoluntarios } from "@/app/actions/escalas";
import { getIgrejaName } from "@/app/actions/configuracoes";
import { TituloIgreja } from "@/components/ui/dashboard/titulo-igreja";
import { getAccessContext } from "@/lib/access";
import { getAdministracao } from "@/app/actions/administracao";

type TabId = "escalas" | "voluntarios" | "relatorios" | "administracao";
const VALID_TABS = new Set<TabId>(["escalas", "voluntarios", "relatorios", "administracao"]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const tab: TabId = VALID_TABS.has(params.tab as TabId)
    ? (params.tab as TabId)
    : "escalas";

  const access = await getAccessContext();

  // Sempre carrega voluntarios (necessario para o modal de nova escala)
  // e o nome da igreja (necessario para o header)
  const [{ data: voluntarios }, nomeIgreja] = await Promise.all([
    getVoluntarios(),
    getIgrejaName(),
  ]);

  // Carrega escalas apenas nas tabs que precisam
  const needsEscalas = tab === "escalas" || tab === "relatorios";
  const { data: escalas } = needsEscalas
    ? await getEscalas()
    : { data: [] as any[] };

  // Carrega admin apenas quando necessario
  const administracao =
    tab === "administracao" && access?.role === "ADMIN"
      ? await getAdministracao()
      : null;

  const listaEscalas = escalas || [];
  const listaVoluntarios = voluntarios || [];

  const dadosAdministracao =
    administracao &&
    !("error" in administracao) &&
    Array.isArray(administracao.ministries) &&
    Array.isArray(administracao.leaders) &&
    Array.isArray(administracao.schedules)
      ? {
          ministries: administracao.ministries,
          leaders: administracao.leaders,
          schedules: administracao.schedules,
        }
      : undefined;

  // Para o header — sempre carrega ministries se admin
  // (necessario para o titulo quando nao esta na aba admin)
  const firstMinistryName =
    dadosAdministracao?.ministries[0]?.nome ??
    (access?.role === "ADMIN" && tab !== "administracao"
      ? await getAdminFirstMinistry(access.ownerClerkUserId)
      : undefined);

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-slate-50 dark:bg-slate-950">
      <header className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <TituloIgreja
              nomeInicial={nomeIgreja}
              ministerio={
                access?.role === "LEADER"
                  ? access.ministryName
                  : firstMinistryName
              }
              podeEditar={access?.role === "ADMIN"}
            />

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie cultos, escalas e voluntários do seu ministério.
            </p>
          </div>

          <div className="md:hidden shrink-0 pt-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <NovoVoluntarioModal />
          </div>
          <div className="flex-1 md:flex-initial">
            <NovaEscalaModal voluntarios={listaVoluntarios} />
          </div>

          <div className="hidden md:block shrink-0 ml-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main>
        <DashboardTabs
          tab={tab}
          escalas={listaEscalas}
          voluntarios={listaVoluntarios}
          nomeIgreja={nomeIgreja}
          administracao={
            access?.role === "ADMIN" ? dadosAdministracao ?? undefined : undefined
          }
        />
      </main>
    </div>
  );
}

import prisma from "@/lib/prisma";

async function getAdminFirstMinistry(
  ownerClerkUserId: string,
): Promise<string | undefined> {
  const ministry = await prisma.ministry.findFirst({
    where: { clerkUserId: ownerClerkUserId },
    select: { nome: true },
    orderBy: { nome: "asc" },
  });
  return ministry?.nome;
}
