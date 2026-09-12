import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ativarContaLider } from "@/app/actions/administracao";

export default async function AtivarLiderPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/leader/activate/${params.id}`);

  const result = await ativarContaLider(params.id);
  if (result.success) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Convite de líder</h1>
        <p className="mt-2 text-sm text-slate-600">
          {result.error || "Não foi possível ativar este convite."}
        </p>
      </div>
    </main>
  );
}
