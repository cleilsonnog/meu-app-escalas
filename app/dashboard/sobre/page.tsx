import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import pkg from "@/package.json";
import { SobreClient } from "./sobre-client";

export default async function SobrePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <SobreClient version={pkg.version} />;
}
