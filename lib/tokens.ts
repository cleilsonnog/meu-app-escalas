import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado");
}

export interface ScheduleTokenPayload {
  scheduleId: string;
  volunteerId: string;
  action: "CONFIRM" | "DECLINE" | "PORTAL";
}

export function generateScheduleToken(
  payload: ScheduleTokenPayload,
  expiresIn: "48h" | "30d" = "48h",
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyScheduleToken(
  token: string,
): ScheduleTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload !== "object" || payload === null) {
      return null;
    }

    const { scheduleId, volunteerId, action } = payload as Partial<ScheduleTokenPayload>;
    if (
      typeof scheduleId !== "string" ||
      typeof volunteerId !== "string" ||
      !["CONFIRM", "DECLINE", "PORTAL"].includes(action as string)
    ) {
      return null;
    }

    return { scheduleId, volunteerId, action: action as ScheduleTokenPayload["action"] };
  } catch {
    return null;
  }
}
