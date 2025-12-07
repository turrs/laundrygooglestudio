declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  }
}
