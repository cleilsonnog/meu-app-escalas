import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-default";

export interface ScheduleTokenPayload {
  scheduleId: string;
  volunteerId: string;
  action: "CONFIRM" | "DECLINE";
}

export function generateScheduleToken(payload: ScheduleTokenPayload): string {
  // Validade de 48 horas para o token expirante
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });
}

export function verifyScheduleToken(
  token: string,
): ScheduleTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as ScheduleTokenPayload;
  } catch {
    return null;
  }
}
