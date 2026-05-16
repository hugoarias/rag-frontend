// API base URL — set VITE_API_URL in .env to override.
// Later this can be replaced with a fetch call to a remote config endpoint.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
