import jwt from "jsonwebtoken";
import { createHmac, timingSafeEqual } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado");
}

export interface ScheduleTokenPayload {
  scheduleId: string;
  volunteerId: string;
  action: "CONFIRM" | "DECLINE" | "PORTAL";
}

const COMPACT_TOKEN_VERSION = "1";
const COMPACT_SIGNATURE_LENGTH = 10;
const ACTION_CODES = { CONFIRM: "C", DECLINE: "D", PORTAL: "P" } as const;
const CODE_ACTIONS = { C: "CONFIRM", D: "DECLINE", P: "PORTAL" } as const;

function uuidToBytes(value: string): Buffer {
  if (!/^[0-9a-fA-F-]{36}$/.test(value)) throw new Error("UUID inválido");
  return Buffer.from(value.replace(/-/g, ""), "hex");
}

function bytesToUuid(value: Buffer): string {
  const hex = value.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function base64Url(value: Buffer): string {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function generateCompactScheduleToken(
  payload: ScheduleTokenPayload,
  expiresIn: "48h" | "30d" = "48h",
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn === "30d" ? 30 : 2) * 24 * 60 * 60;
  const expiration = Buffer.alloc(4);
  expiration.writeUInt32BE(expiresAt, 0);
  const body = Buffer.concat([
    uuidToBytes(payload.scheduleId),
    uuidToBytes(payload.volunteerId),
    Buffer.from(ACTION_CODES[payload.action]),
    expiration,
  ]);
  const signature = createHmac("sha256", JWT_SECRET).update(body).digest().subarray(0, COMPACT_SIGNATURE_LENGTH);
  return `${COMPACT_TOKEN_VERSION}.${base64Url(Buffer.concat([body, signature]))}`;
}

function verifyCompactScheduleToken(token: string): ScheduleTokenPayload | null {
  try {
    const [version, encoded] = token.split(".");
    if (version !== COMPACT_TOKEN_VERSION || !encoded) return null;
    const value = fromBase64Url(encoded);
    if (value.length !== 47) return null;
    const body = value.subarray(0, 37);
    const receivedSignature = value.subarray(37);
    const expectedSignature = createHmac("sha256", JWT_SECRET).update(body).digest().subarray(0, COMPACT_SIGNATURE_LENGTH);
    if (!timingSafeEqual(receivedSignature, expectedSignature)) return null;
    const expiresAt = body.readUInt32BE(33);
    if (expiresAt < Math.floor(Date.now() / 1000)) return null;
    const action = CODE_ACTIONS[body.subarray(32, 33).toString() as keyof typeof CODE_ACTIONS];
    if (!action) return null;
    return {
      scheduleId: bytesToUuid(body.subarray(0, 16)),
      volunteerId: bytesToUuid(body.subarray(16, 32)),
      action,
    };
  } catch {
    return null;
  }
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
  const compactPayload = verifyCompactScheduleToken(token);
  if (compactPayload) return compactPayload;

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload !== "object" || payload === null) {
      return null;
    }

    const { scheduleId, volunteerId, action } =
      payload as Partial<ScheduleTokenPayload>;
    if (
      typeof scheduleId !== "string" ||
      typeof volunteerId !== "string" ||
      !["CONFIRM", "DECLINE", "PORTAL"].includes(action as string)
    ) {
      return null;
    }

    return {
      scheduleId,
      volunteerId,
      action: action as ScheduleTokenPayload["action"],
    };
  } catch {
    return null;
  }
}
