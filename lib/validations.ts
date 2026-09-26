import { z } from "zod";

const trimmed = z.string().trim();
const requiredTrimmed = trimmed.min(1, "Campo obrigatório.");
const uuid = trimmed.uuid("ID inválido.");
const optionalUuid = trimmed.uuid("ID inválido.").optional().or(z.literal(""));
const phone = requiredTrimmed.min(8, "Telefone inválido.");
const email = trimmed.email("E-mail inválido.").toLowerCase();
const optionalEmail = z.union([email, z.literal(""), z.null()]).optional();

// --- Voluntários ---

export const createVoluntarioSchema = z.object({
  nome: requiredTrimmed.max(120, "Nome muito longo."),
  telefone: phone,
  email: optionalEmail,
  departamento: trimmed.max(60).optional().default("Geral"),
});

export const updateVoluntarioSchema = z.object({
  nome: requiredTrimmed.max(120, "Nome muito longo."),
  telefone: phone,
  departamento: trimmed.max(60).optional().default("Geral"),
});

// --- Eventos ---

export const criarEventoSchema = z.object({
  titulo: trimmed.max(120).default("Culto"),
  dataHora: requiredTrimmed,
});

export const updateEventoSchema = z.object({
  titulo: requiredTrimmed.max(120, "Título muito longo."),
  dataHora: requiredTrimmed,
});

// --- Escalas ---

export const criarEscalaSchema = z.object({
  tituloEvento: requiredTrimmed.max(120),
  dataHora: requiredTrimmed,
  volunteerId: uuid,
  funcaoEspecifica: requiredTrimmed.max(120),
  ministryId: optionalUuid,
});

export const adicionarVoluntarioSchema = z.object({
  eventId: uuid,
  volunteerId: uuid,
  funcaoEspecifica: requiredTrimmed.max(120),
});

export const responderEscalaSchema = z.object({
  id: uuid,
  novoStatus: z.enum(["CONFIRMADO", "RECUSADO"]),
  observacao: trimmed.max(500).optional(),
  token: trimmed.optional(),
});

// --- Administração ---

export const ministerioSchema = z.object({
  nome: requiredTrimmed.max(120, "Nome muito longo."),
  descricao: z
    .union([trimmed.max(300), z.literal("")])
    .optional()
    .transform((v) => v || null),
});

export const cadastrarLiderSchema = z.object({
  nome: requiredTrimmed.max(120),
  email: email,
  telefone: phone,
  ministryId: uuid,
});

// --- Configurações ---

export const salvarIgrejaSchema = z.object({
  churchName: requiredTrimmed.max(120, "Nome muito longo."),
});

// --- Helpers ---

export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { data: z.infer<T> } | { error: string } {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Dados inválidos.";
    return { error: firstError };
  }
  return { data: result.data };
}
