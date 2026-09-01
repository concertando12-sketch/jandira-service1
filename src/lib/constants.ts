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

// Teste grátis de lançamento (Fase 10) — cada pessoa (cliente ou
// prestador) fica liberada por N dias a partir do PRÓPRIO cadastro,
// sem precisar de assinatura aprovada. Vencimento = created_at + esses
// dias. Espelha o mesmo cálculo em has_active_subscription() no banco
// (supabase/schema.sql) — mudar aqui não muda o banco sozinho, os dois
// precisam ser atualizados juntos.
export const TRIAL_DAYS = 30;

// Data em que a plataforma passou a valer pra contabilidade de
// verdade — só usada pras telas financeiras do admin (Financeiro,
// Receita do mês) ignorarem pagamentos de teste/ajuste feitos durante
// o desenvolvimento, antes disso. Não tem relação com o teste grátis
// de cada pessoa (isso é o TRIAL_DAYS acima).
export const LAUNCH_DATE = "2026-09-01";

export const ROLE_LABELS = {
  CLIENT: "Cliente",
  PROVIDER: "Prestador",
  ADMIN: "Administrador",
} as const;

export type UserRole = keyof typeof ROLE_LABELS;

// Pra onde cada role vai quando já está logado — usado pelo middleware
// (rota errada -> home certa) e pelas páginas de entrada (/, /login,
// /cadastro): quem já tem sessão válida não deve ver tela de
// login/cadastro de novo, vai direto pro dashboard.
export const ROLE_HOME: Record<UserRole, string> = {
  CLIENT: "/cliente/dashboard",
  PROVIDER: "/prestador/dashboard",
  ADMIN: "/admin/dashboard",
};

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
