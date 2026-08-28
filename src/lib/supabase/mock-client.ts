// Cliente Supabase "de mentira" usado SÓ quando o projeto ainda não foi
// conectado (ver isSupabaseConfigured). Nunca bate na rede — qualquer
// `.from(...).select()...`, `.rpc(...)` etc. resolve com uma lista/valor
// vazio, como se o banco existisse mas estivesse zerado. Isso permite
// abrir todas as telas (modo prévia, src/app/preview) sem travar
// esperando uma URL falsa. Some sozinho assim que .env.local tiver as
// chaves reais — nenhuma limpeza manual necessária.
// `data: null` (não `[]`) de propósito: várias telas fazem `if (city)
// ...` pra decidir se acharam uma linha (.single()/.maybeSingle()) — um
// array vazio é "truthy" em JS e quebraria essa checagem. Como o resto
// do código sempre usa `?? []`/optional chaining pros casos de lista,
// `null` funciona certinho nos dois casos.
const EMPTY_RESULT = { data: null, error: null, count: 0 };

function createThenableBuilder(): unknown {
  const builder: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (onFulfilled: (v: typeof EMPTY_RESULT) => unknown) =>
            Promise.resolve(EMPTY_RESULT).then(onFulfilled);
        }
        if (prop === "catch" || prop === "finally") {
          return () => builder;
        }
        // Qualquer outro método (select/eq/order/limit/single/
        // maybeSingle/insert/update/upsert/delete/in/...) continua a
        // cadeia — ignora os argumentos, sempre volta o mesmo builder.
        return () => builder;
      },
    },
  );
  return builder;
}

export function createMockSupabaseClient(): unknown {
  return {
    from: () => createThenableBuilder(),
    rpc: () => createThenableBuilder(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
  };
}
