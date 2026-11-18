import { fetchAPI } from './api';

export interface GrupoReporte {
  id: number;
  codigo_obra: string;
  estado_actual: string;
  fecha_estimada_fin: string | null;
  creado_por_usuario_id: number;
  categoria_id: number | null;
  creado_en: string;
  total_reportes?: number;
  preview_imagen?: string;
}

export interface Actualizacion {
  id: number;
  grupo_id: number;
  usuario_id: number;
  comentario: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  url_imagen: string | null;
  recursos_solicitados: string | null;
  fecha_estimada_fin: string | null;
  lat_actualizada: number | null;
  lng_actualizada: number | null;
  creado_en: string;
}

/** Reporte individual dentro de un Caso de Obra (GET /admin/groups/:id/reports). */
export interface ReporteDeGrupo {
  id: number;
  categoria_id: number;
  grupo_id: number | null;
  estado: string;
  gravedad: string;
  lat: number;
  lng: number;
  url_imagen: string | null;
  device_id: string;
  creado_en: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface VisitaCaso {
  id: number;
  grupo_id: number;
  cuadrilla_id: number;
  tecnico_id: number | null;
  fecha_planificada: string | null;
  orden_ruta: number | null;
  llegada_en: string | null;
  cerrada_en: string | null;
  caso: GrupoReporte | null;
}

export interface ContextoOperativo {
  roles: string[];
  es_responsable: boolean;
  cuadrillas: Array<{ cuadrilla_id: number; es_responsable: boolean }>;
}

export interface DetalleVisita {
  visita: VisitaCaso;
  caso: GrupoReporte;
  agrupacion: { total_reportes: number; reportes: ReporteDeGrupo[] };
}

/** Bitácora de obra del técnico: no cambia el estado del caso. */
export interface ActualizacionPayload {
  comentario: string;
  recursos_solicitados?: string;
  fecha_estimada_fin?: string;
  lat_actualizada?: number;
  lng_actualizada?: number;
  url_imagen?: string;
}

/** Resultados que el técnico puede proponer al cerrar una visita. */
export type EstadoPropuesto =
  | 'EnTrabajo'
  | 'Reencolado'
  | 'Finalizado'
  | 'Derivado'
  | 'RechazadoCampo';

export interface PropuestaPayload {
  estado_propuesto: EstadoPropuesto;
  comentario: string;
  evidencia_url?: string;
  entidad_destino?: string;
  categoria_rechazo_id?: number;
}

export interface MiembroCuadrilla {
  cuadrilla_id: number;
  usuario_id: number;
  nombre: string;
  es_responsable: boolean;
}

export interface BandejaCuadrilla extends PaginatedResponse<VisitaCaso> {
  miembros: MiembroCuadrilla[];
}

export interface PropuestaPendiente {
  id: number;
  visita_id: number;
  estado_propuesto: EstadoPropuesto;
  comentario: string;
  entidad_destino: string | null;
  evidencia_url: string | null;
  tecnico_nombre: string | null;
  creado_en: string;
  visita: VisitaCaso | null;
  caso: GrupoReporte | null;
}

export async function getGroupReports(id: number): Promise<ReporteDeGrupo[]> {
  return fetchAPI<ReporteDeGrupo[]>(`/admin/groups/${id}/reports`);
}

export async function getCaseTimeline(id: number): Promise<Actualizacion[]> {
  return fetchAPI<Actualizacion[]>(`/operacion/tecnico/groups/${id}/timeline`);
}

export async function addActualizacion(grupo_id: number, payload: ActualizacionPayload) {
  return fetchAPI<{ id: number; grupo_id: number; comentario: string; creado_en: string }>(
    `/operacion/tecnico/groups/${grupo_id}/updates`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

export function getContextoOperativo(): Promise<ContextoOperativo> {
  return fetchAPI<ContextoOperativo>('/operacion/contexto');
}

export function listMisObras(page = 1, limit = 20): Promise<PaginatedResponse<VisitaCaso>> {
  return fetchAPI<PaginatedResponse<VisitaCaso>>(
    `/operacion/mis-obras?page=${page}&limit=${limit}`,
  );
}

export function listMiRuta(fecha: string): Promise<PaginatedResponse<VisitaCaso>> {
  return fetchAPI<PaginatedResponse<VisitaCaso>>(`/operacion/mi-ruta?fecha=${fecha}`);
}

export function getVisita(id: number): Promise<DetalleVisita> {
  return fetchAPI<DetalleVisita>(`/operacion/visitas/${id}`);
}

export function registrarLlegadaVisita(id: number, lat: number, lng: number): Promise<VisitaCaso> {
  return fetchAPI<VisitaCaso>(`/operacion/visitas/${id}/llegada`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  });
}

export function proponerResultado(visitaId: number, payload: PropuestaPayload) {
  return fetchAPI<{ requiere_confirmacion?: boolean; estado_actual?: string; id?: number }>(
    `/operacion/visitas/${visitaId}/propuestas`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

// ── Responsable de cuadrilla ────────────────────────────────────────────

export function listVisitasCuadrilla(): Promise<BandejaCuadrilla> {
  return fetchAPI<BandejaCuadrilla>('/operacion/mi-cuadrilla/visitas?limit=100');
}

export function asignarVisita(
  visitaId: number,
  payload: { tecnico_id: number; fecha_planificada: string; orden_ruta: number },
): Promise<VisitaCaso> {
  return fetchAPI<VisitaCaso>(`/operacion/mi-cuadrilla/visitas/${visitaId}/asignacion`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function listPropuestasCuadrilla(): Promise<PropuestaPendiente[]> {
  return fetchAPI<PropuestaPendiente[]>('/operacion/mi-cuadrilla/propuestas');
}

export function confirmarPropuesta(id: number, motivo?: string) {
  return fetchAPI<PropuestaPendiente>(`/operacion/mi-cuadrilla/propuestas/${id}/confirmar`, {
    method: 'POST',
    body: JSON.stringify({ motivo_decision: motivo }),
  });
}

export function descartarPropuesta(id: number, motivo: string) {
  return fetchAPI<PropuestaPendiente>(`/operacion/mi-cuadrilla/propuestas/${id}/descartar`, {
    method: 'POST',
    body: JSON.stringify({ motivo_decision: motivo }),
  });
}
