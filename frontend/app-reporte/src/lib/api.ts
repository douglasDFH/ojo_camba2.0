import { getToken } from './auth';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Cabeceras comunes: JSON y, si el ciudadano inició sesión, su token. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function getImageUrl(url_imagen: string | null): string {
  if (!url_imagen) return '';
  if (url_imagen.startsWith('http')) return url_imagen;
  return API_URL + (url_imagen.startsWith('/') ? url_imagen : '/' + url_imagen);
}

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
