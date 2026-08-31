// Configuração global de região — item 5 da spec.
// O MVP atende SOMENTE esta cidade. Novas cidades entram pelo admin no
// futuro (item 21), mas o app inteiro assume esta como padrão por ora.
export const APP_CITY = process.env.NEXT_PUBLIC_APP_CITY ?? "Jandira";
export const APP_STATE = process.env.NEXT_PUBLIC_APP_STATE ?? "SP";
export const APP_COUNTRY = process.env.NEXT_PUBLIC_APP_COUNTRY ?? "BR";

// Suporte único por WhatsApp (dono da plataforma) — substitui o antigo
// "falar no WhatsApp" por prestador. Cliente e prestador usam o mesmo
// número pra qualquer dúvida.
export const SUPPORT_WHATSAPP_PHONE = "+55 11 98514-9222";

// Período de teste grátis de lançamento (Fase 9) — todo mundo (cliente
// e prestador) fica liberado sem precisar de assinatura aprovada até
// essa data. Espelha o mesmo corte em has_active_subscription() no
// banco (supabase/schema.sql) — mudar aqui não muda o banco sozinho,
// os dois precisam ser atualizados juntos.
export const FREE_TRIAL_END_DATE = "2026-10-01";

export const ROLE_LABELS = {
  CLIENT: "Cliente",
  PROVIDER: "Prestador",
  ADMIN: "Administrador",
} as const;

export type UserRole = keyof typeof ROLE_LABELS;

export const REQUEST_STATUS_LABELS = {
  PENDING: "Aguardando resposta",
  ACCEPTED: "Aceita",
  DECLINED: "Recusada",
  SCHEDULED: "Agendada",
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
