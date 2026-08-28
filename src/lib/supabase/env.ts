// Lê as credenciais do Supabase sem derrubar o app quando elas ainda
// não foram configuradas — permite montar/telar o projeto antes de ter
// um projeto Supabase real (decisão tomada na Fase 1).
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
