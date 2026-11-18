import { authHeaders } from './api';
const QUEUE_KEY = 'ojo_camba_offline_queue';

interface QueuedReporte {
  device_id: string;
  lat: number;
  lng: number;
  categoria_id: number;
  gravedad: string;
  imagen_base64: string;
  usuario_id?: number | null;
  createdAt: number;
}

export function getQueue(): QueuedReporte[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueue(reporte: Omit<QueuedReporte, 'createdAt'>) {
  const queue = getQueue();
  // La foto ya llega comprimida desde la cámara (lib/imagen.ts).
  queue.push({ ...reporte, createdAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeQueued(index: number) {
  const queue = getQueue();
  queue.splice(index, 1);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flush(baseUrl: string) {
  const queue = getQueue();
  if (queue.length === 0) return;

  let success = 0;
  for (let i = queue.length - 1; i >= 0; i--) {
    try {
      const res = await fetch(`${baseUrl}/reportes`, {
        method: 'POST',
        // El autor sale del token vigente al enviar; el usuario_id guardado en la
        // cola ya no se usa (el gateway lo ignora).
        headers: authHeaders(),
        body: JSON.stringify(queue[i]),
      });
      if (res.ok) {
        removeQueued(i);
        success++;
      } else if (
        res.status >= 400 &&
        res.status < 500 &&
        res.status !== 408 &&
        res.status !== 429
      ) {
        // Rechazo definitivo (fuera del área, dispositivo bloqueado, foto
        // inválida): reintentar no lo arregla y bloquearía la cola para siempre.
        removeQueued(i);
      }
    } catch {
      break;
    }
  }
  return success;
}
