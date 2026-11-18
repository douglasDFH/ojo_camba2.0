import { fetchAPI } from './api';

/**
 * Rechazos de campo que proponen los técnicos y decide la coordinación
 * operativa (issue #2). Tipos de wire propios, misma convención que el resto de
 * clientes del backoffice.
 */
export interface RechazoCampoPendiente {
  id: number;
  visita_id: number;
  estado_propuesto: 'RechazadoCampo';
  comentario: string;
  categoria_rechazo_id: number | null;
  evidencia_url: string | null;
  tecnico_nombre: string | null;
  creado_en: string;
  caso: { id: number; codigo_obra: string; estado_actual: string } | null;
}

export function listRechazosCampo(): Promise<RechazoCampoPendiente[]> {
  return fetchAPI<RechazoCampoPendiente[]>('/operacion/excepciones/propuestas');
}

/** Confirmar el rechazo cierra el caso como RechazadoCampo. */
export function confirmarRechazoCampo(id: number, motivo?: string) {
  return fetchAPI(`/operacion/excepciones/propuestas/${id}/rechazar`, {
    method: 'POST',
    body: JSON.stringify({ motivo_decision: motivo }),
  });
}

/** Descartar devuelve la visita al técnico, con el motivo en la bitácora. */
export function descartarRechazoCampo(id: number, motivo: string) {
  return fetchAPI(`/operacion/excepciones/propuestas/${id}/descartar`, {
    method: 'POST',
    body: JSON.stringify({ motivo_decision: motivo }),
  });
}
