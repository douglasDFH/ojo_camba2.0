import { ArrowLeft, Camera, CheckCircle2, MapPin, NotebookPen, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { getImageUrl } from '../lib/api';
import { getVisita, registrarLlegadaVisita, type DetalleVisita } from '../lib/tecnicoApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { friendlyError } from '../lib/errors';
import StatusBadge from '../components/StatusBadge';
import BitacoraVisita from '../components/BitacoraVisita';
import ResultadoVisita from '../components/ResultadoVisita';
import RutaSugerida from '../components/RutaSugerida';

export default function DetalleVisitaPage() {
  const { id } = useParams<{ id: string }>();
  const visitaId = Number(id);
  const [detalle, setDetalle] = useState<DetalleVisita | null>(null);
  const [error, setError] = useState('');
  const [enviandoLlegada, setEnviandoLlegada] = useState(false);
  const [aviso, setAviso] = useState('');
  const gps = useGeolocation();

  const cargar = useCallback(() => {
    if (!Number.isInteger(visitaId)) return;
    getVisita(visitaId)
      .then(setDetalle)
      .catch((err) => setError(friendlyError(err)));
  }, [visitaId]);

  useEffect(cargar, [cargar]);

  const confirmarLlegada = async () => {
    try {
      setError('');
      setEnviandoLlegada(true);
      const fix = await gps.capture();
      await registrarLlegadaVisita(visitaId, fix.lat, fix.lng);
      // Recargar: la llegada puede pasar el caso a ValidacionCampo.
      cargar();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setEnviandoLlegada(false);
    }
  };

  if (!Number.isInteger(visitaId)) return <p className="text-sm text-red-700">Visita inválida.</p>;
  if (!detalle && !error)
    return <div className="h-36 animate-pulse rounded-3xl-3 bg-perla" aria-busy="true" />;
  if (!detalle)
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );

  const { visita, caso } = detalle;
  const cerrada = Boolean(visita.cerrada_en);
  const llego = Boolean(visita.llegada_en);

  return (
    <div className="space-y-5 pb-28">
      <Link
        to="/mis-obras"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-caoba"
      >
        <ArrowLeft className="h-4 w-4" /> Mis obras
      </Link>
      <section className="rounded-3xl-3 bg-perla p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ladrillo">
              Caso de Obra
            </p>
            <h1 className="mt-1 text-xl font-semibold text-catedral">{caso.codigo_obra}</h1>
          </div>
          <StatusBadge estado={caso.estado_actual} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-arena">
          <UsersRound className="h-4 w-4" />
          {detalle.agrupacion.total_reportes} reportes ciudadanos agrupados
        </div>
        {visita.fecha_planificada && (
          <p className="mt-2 text-sm text-arena">
            Visita planificada para el {visita.fecha_planificada}
            {visita.orden_ruta ? ` · parada ${visita.orden_ruta}` : ''}
          </p>
        )}
      </section>

      {aviso && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-2xl bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
        </p>
      )}

      {cerrada ? (
        <section className="rounded-3xl-3 bg-perla p-5 text-sm text-arena shadow-sm">
          Esta visita está cerrada. Si el caso necesita otra, aparecerá en Mis obras cuando tu
          responsable la planifique.
        </section>
      ) : (
        llego && (
          <>
            <section className="rounded-3xl-3 bg-perla p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-tierra">
                <NotebookPen className="h-4 w-4" /> Bitácora de obra
              </h2>
              <p className="mt-1 text-xs text-arena">
                Registra avances, fotos o materiales que necesitas. No cambia el estado del caso.
              </p>
              <BitacoraVisita grupoId={caso.id} onGuardado={() => setAviso('Avance agregado.')} />
            </section>
            <section className="rounded-3xl-3 bg-perla p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-tierra">Resultado de la visita</h2>
              <ResultadoVisita
                visitaId={visita.id}
                estadoCaso={caso.estado_actual}
                onEnviado={(mensaje) => {
                  setAviso(mensaje);
                  cargar();
                }}
              />
            </section>
          </>
        )
      )}

      <section className="rounded-3xl-3 bg-perla p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-tierra">Reportes que originaron esta obra</h2>
        <ul className="mt-4 space-y-3">
          {detalle.agrupacion.reportes.map((reporte) => (
            <li key={reporte.id} className="flex gap-3 rounded-3xl-2 bg-lienzo p-3">
              {reporte.url_imagen ? (
                <img
                  // url_imagen guarda la clave de S3; la foto se sirve por el gateway.
                  src={
                    reporte.url_imagen.startsWith('http')
                      ? reporte.url_imagen
                      : getImageUrl(`/reportes/${reporte.id}/imagen`)
                  }
                  alt={`Evidencia del reporte ${reporte.id}`}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yeso text-arena">
                  <Camera className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 text-xs text-arena">
                <p className="font-semibold text-tierra">Reporte #{reporte.id}</p>
                <p className="mt-1">
                  Categoría {reporte.categoria_id} · {reporte.gravedad}
                </p>
                <p className="mt-1">
                  {Number(reporte.lat).toFixed(5)}, {Number(reporte.lng).toFixed(5)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {detalle.agrupacion.total_reportes > 1 && <RutaSugerida grupoId={caso.id} />}

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {!cerrada && !llego && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-arcilla bg-perla p-4">
          <div className="mx-auto max-w-sm">
            <button
              type="button"
              disabled={enviandoLlegada}
              onClick={confirmarLlegada}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-pill bg-selva px-6 text-sm font-semibold text-perla shadow-md disabled:opacity-60"
            >
              <MapPin className="h-5 w-5" />
              {enviandoLlegada ? 'Obteniendo GPS…' : 'Registrar llegada'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
