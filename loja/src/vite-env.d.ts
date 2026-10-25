/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_LOCAL_ADMIN_PASSWORD?: string
  readonly VITE_META_PIXEL_ID?: string
  /** Endereço público da loja, ex.: https://medique.co.mz (para partilhas e Google). */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
