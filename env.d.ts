
// Reference removed to resolve "Cannot find type definition file for 'vite/client'"
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Legacy support
  readonly REACT_APP_SUPABASE_URL?: string;
  readonly REACT_APP_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  }
}
