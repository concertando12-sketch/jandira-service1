// Configuração global de região — item 5 da spec.
// O MVP atende SOMENTE esta cidade. Novas cidades entram pelo admin no
// futuro (item 21), mas o app inteiro assume esta como padrão por ora.
export const APP_CITY = process.env.NEXT_PUBLIC_APP_CITY ?? "Jandira";
export const APP_STATE = process.env.NEXT_PUBLIC_APP_STATE ?? "SP";
export const APP_COUNTRY = process.env.NEXT_PUBLIC_APP_COUNTRY ?? "BR";

export const ROLE_LABELS = {
  CLIENT: "Cliente",
  PROVIDER: "Prestador",
  ADMIN: "Administrador",
} as const;

export type UserRole = keyof typeof ROLE_LABELS;

export const REQUEST_STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  DECLINED: "Recusada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;

export type RequestStatus = keyof typeof REQUEST_STATUS_LABELS;

// Cookie do "modo prévia" (ver src/lib/preview.ts) — só existe enquanto
// o Supabase não estiver configurado. Fica num arquivo sem dependências
// de servidor porque o middleware precisa ler o nome sem importar
// `next/headers`.
export const PREVIEW_ROLE_COOKIE = "dev_preview_role";
