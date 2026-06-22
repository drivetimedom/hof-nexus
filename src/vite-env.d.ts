/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_FACEBOOK_API_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
