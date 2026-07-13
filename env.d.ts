interface ImportMetaEnv {
  readonly WXT_DEEPSEEK_API_KEY: string;
  readonly WXT_HH_USER_AGENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
