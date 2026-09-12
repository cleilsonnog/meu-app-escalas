import { NextRequest, NextResponse } from "next/server";
import { verifyScheduleToken } from "@/lib/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const payload = verifyScheduleToken(params.token);
  if (!payload) {
    return NextResponse.json(
      { error: "Link inválido ou expirado." },
      { status: 404 },
    );
  }

  const destination =
    payload.action === "PORTAL"
      ? `/voluntario/${payload.volunteerId}`
      : `/confirmar/${payload.scheduleId}`;
  const url = new URL(destination, req.url);
  url.searchParams.set("token", params.token);
  return NextResponse.rewrite(url);
}
