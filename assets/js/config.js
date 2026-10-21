// assets/js/config.js — ONLY non-sensitive values!
window.APP_CONFIG = {
  // API Endpoints
  API_BASE_URL: "/api",
  AI_WORKER_ENDPOINT: "/api/ai-chat",

  // Brand
  BRAND_NAME: "Fly Trip Visa",
  BRAND_NAME_CN: "飞行旅行签证",
  SUPPORT_EMAIL: "visa@flytripvisa.site",
  SUPPORT_PHONE: "+8801338354383",

  // Session
  SESSION_KEY: "ftv_admin_session",
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24h

  // Features
  ENABLE_ANALYTICS: true,
  ENABLE_VOICE: true,
  ENABLE_AI_CHAT: true,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  // Pagination
  TABLE_PAGE_SIZE: 10,

  // Default Language
  DEFAULT_LANG: "en",

  // R2 Assets (if using Cloudflare R2)
  R2_PUBLIC_URL: "https://pub-b261978d710f40a0944a1ed1d89e1399.r2.dev"
};
