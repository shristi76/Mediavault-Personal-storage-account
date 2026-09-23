export const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const APP_URL =
  (import.meta.env.VITE_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")).replace(/\/$/, "");

export const api = (path) => `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
