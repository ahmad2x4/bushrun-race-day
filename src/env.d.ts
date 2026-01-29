/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_URL: string;
  readonly VITE_WP_USERNAME: string;
  readonly VITE_WP_APP_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
