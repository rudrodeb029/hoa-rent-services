import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found in environment variables.");
}

// Avoid throwing immediately on import to prevent page/app crashes
let supabaseClient: any = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
}

const makeMockQuery = (val: any = null) => {
  const promise = Promise.resolve({ data: val, error: null });
  const chainObj = {
    select: () => chainObj,
    insert: () => chainObj,
    update: () => chainObj,
    eq: () => chainObj,
    order: () => chainObj,
    single: () => Promise.resolve({ data: val, error: null }),
    then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected?: any) => promise.catch(onrejected),
    finally: (onfinally?: any) => promise.finally(onfinally),
  };
  return chainObj;
};

export const supabase = supabaseClient || {
  from: (table: string) => {
    if (table === "page_settings") return makeMockQuery(null);
    return makeMockQuery([]);
  },
  storage: {
    from: () => ({
      upload: (path: string) => Promise.resolve({ data: { path }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000" } })
    })
  }
};
