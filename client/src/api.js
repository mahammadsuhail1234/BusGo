const HOST = (import.meta.env.HOST || "http://localhost:5000").replace(/\/+$/, "");

export const API_BASE_URL = HOST.endsWith("/api") ? HOST : `${HOST}/api`;
