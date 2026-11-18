import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Users } from 'lucide-react';
import {
  asignarVisita,
  confirmarPropuesta,
  descartarPropuesta,
  listPropuestasCuadrilla,
  listVisitasCuadrilla,
  type BandejaCuadrilla,
  type MiembroCuadrilla,
  type PropuestaPendiente,
  type VisitaCaso,
} from '../lib/tecnicoApi';
import { getImageUrl } from '../lib/api';
import { friendlyError } from '../lib/errors';
import StatusBadge from '../components/StatusBadge';
import { hoyLocal as hoy } from '../lib/fecha';

const NOMBRE_RESULTADO: Record<string, string> = {
  Finalizado: 'Trabajo terminado',
  Derivado: 'Derivar a otra entidad',
};

/** Bandeja del responsable: decidir propuestas y repartir visitas de su cuadrilla. */
export default function CuadrillaPage() {
  const [bandeja, setBandeja] = useState<BandejaCuadrilla | null>(null);
  const [propuestas, setPropuestas] = useState<PropuestaPendiente[]>([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(() => {
    Promise.all([listVisitasCuadrilla(), listPropuestasCuadrilla()])
      .then(([visitas, pendientes]) => {
        setBandeja(visitas);
        setPropuestas(pendientes);
      })
      .catch((err) => setError(friendlyError(err)));
  }, []);

  useEffect(cargar, [cargar]);

  const hecho = (mensaje: string) => {
    setAviso(mensaje);
    setError('');
    cargar();
  };

  if (!bandeja && !error)
    return <div className="h-36 animate-pulse rounded-3xl-3 bg-perla" aria-busy="true" />;

  return (
    <div className="space-y-5 pb-3">
      <section className="rounded-hero bg-catedral p-6 text-perla">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-arena">
          Responsable de cuadrilla
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Tu cuadrilla</h1>
        <p className="mt-2 text-sm leading-6 text-almendra">
          Decide los resultados que proponen tus técnicos y reparte las visitas del día.
        </p>
      </section>

      {aviso && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-2xl bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-tierra">
          <ClipboardCheck className="h-4 w-4" /> Propuestas por decidir ({propuestas.length})
        </h2>
        {propuestas.length === 0 ? (
          <p className="rounded-3xl-3 bg-perla p-4 text-sm text-arena shadow-sm">
            No hay propuestas esperando tu decisión.
          </p>
        ) : (
          propuestas.map((propuesta) => (
            <TarjetaPropuesta
              key={propuesta.id}
              propuesta={propuesta}
              onHecho={hecho}
              onError={setError}
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-tierra">
          <Users className="h-4 w-4" /> Visitas abiertas ({bandeja?.data.length ?? 0})
        </h2>
        {bandeja && bandeja.data.length === 0 ? (
          <p className="rounded-3xl-3 bg-perla p-4 text-sm text-arena shadow-sm">
            Tu cuadrilla no tiene visitas abiertas.
          </p>
        ) : (
          bandeja?.data.map((visita) => (
            <TarjetaReparto
              key={visita.id}
              visita={visita}
              miembros={bandeja.miembros.filter((m) => m.cuadrilla_id === visita.cuadrilla_id)}
              ordenSugerido={
                bandeja.data.filter(
                  (v) => v.fecha_planificada === hoy() && v.cuadrilla_id === visita.cuadrilla_id,
                ).length + 1
              }
              onHecho={hecho}
              onError={setError}
            />
          ))
        )}
      </section>
    </div>
  );
}

function TarjetaPropuesta({
  propuesta,
  onHecho,
  onError,
}: {
  propuesta: PropuestaPendiente;
  onHecho: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const decidir = async (accion: 'confirmar' | 'descartar') => {
    if (accion === 'descartar' && !motivo.trim()) {
      onError('Para descartar, escribe el motivo: el técnico lo verá en la bitácora.');
      return;
    }
    try {
      setEnviando(true);
      if (accion === 'confirmar') {
        await confirmarPropuesta(propuesta.id, motivo.trim() || undefined);
        onHecho(
          `Caso ${propuesta.caso?.codigo_obra ?? ''} cerrado como ${propuesta.estado_propuesto}.`,
        );
      } else {
        await descartarPropuesta(propuesta.id, motivo.trim());
        onHecho('Propuesta descartada. La visita sigue abierta para el técnico.');
      }
    } catch (err) {
      onError(friendlyError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article className="space-y-3 rounded-3xl-3 bg-perla p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-catedral">
            {propuesta.caso?.codigo_obra ?? `Visita ${propuesta.visita_id}`}
          </p>
          <p className="text-xs text-arena">
            {NOMBRE_RESULTADO[propuesta.estado_propuesto] ?? propuesta.estado_propuesto} · propuesto
            por {propuesta.tecnico_nombre ?? 'un técnico'}
          </p>
        </div>
        <StatusBadge estado={propuesta.estado_propuesto} />
      </div>
      <p className="text-sm text-tierra">{propuesta.comentario}</p>
      {propuesta.entidad_destino && (
        <p className="text-xs text-arena">Entidad: {propuesta.entidad_destino}</p>
      )}
      {propuesta.evidencia_url && <EvidenciaPropuesta propuesta={propuesta} />}
      <label className="block text-xs font-semibold text-tierra">
        Motivo (obligatorio para descartar)
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => decidir('descartar')}
          className="min-h-12 rounded-pill border border-arcilla px-4 text-sm font-semibold text-caoba disabled:opacity-60"
        >
          Descartar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => decidir('confirmar')}
          className="min-h-12 rounded-pill bg-selva px-4 text-sm font-semibold text-perla disabled:opacity-60"
        >
          Confirmar
        </button>
      </div>
    </article>
  );
}

/**
 * La foto de la propuesta también quedó en la bitácora del caso. Si la clave
 * es una URL externa se muestra directo; si es de S3 se indica que está en la
 * bitácora, porque el gateway sirve esas fotos por el id de la actualización.
 */
function EvidenciaPropuesta({ propuesta }: { propuesta: PropuestaPendiente }) {
  const url = propuesta.evidencia_url ?? '';
  if (url.startsWith('http')) {
    return (
      <img src={getImageUrl(url)} alt="Evidencia" className="h-28 w-28 rounded-2xl object-cover" />
    );
  }
  return <p className="text-xs text-arena">Foto de evidencia adjunta en la bitácora del caso.</p>;
}

function TarjetaReparto({
  visita,
  miembros,
  ordenSugerido,
  onHecho,
  onError,
}: {
  visita: VisitaCaso;
  miembros: MiembroCuadrilla[];
  ordenSugerido: number;
  onHecho: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}) {
  const [tecnico, setTecnico] = useState(visita.tecnico_id ? String(visita.tecnico_id) : '');
  const [fecha, setFecha] = useState(visita.fecha_planificada ?? hoy());
  const [orden, setOrden] = useState(String(visita.orden_ruta ?? ordenSugerido));
  const [enviando, setEnviando] = useState(false);
  const asignada = Boolean(visita.tecnico_id && visita.fecha_planificada);

  const guardar = async () => {
    if (!tecnico) return onError('Elige un técnico.');
    try {
      setEnviando(true);
      await asignarVisita(visita.id, {
        tecnico_id: Number(tecnico),
        fecha_planificada: fecha,
        orden_ruta: Number(orden),
      });
      const nombre = miembros.find((m) => String(m.usuario_id) === tecnico)?.nombre ?? 'el técnico';
      onHecho(
        `Visita de ${visita.caso?.codigo_obra ?? visita.id} asignada a ${nombre} para el ${fecha}.`,
      );
    } catch (err) {
      onError(friendlyError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article className="space-y-3 rounded-3xl-3 bg-perla p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-catedral">
            {visita.caso?.codigo_obra ?? `Visita ${visita.id}`}
          </p>
          <p className="text-xs text-arena">
            {asignada
              ? `Asignada para el ${visita.fecha_planificada}${visita.llegada_en ? ' · técnico en el lugar' : ''}`
              : 'Sin técnico o sin fecha'}
          </p>
        </div>
        {visita.caso && <StatusBadge estado={visita.caso.estado_actual} />}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-tierra">
          Técnico
          <select
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
          >
            <option value="">Elegir…</option>
            {miembros.map((miembro) => (
              <option key={miembro.usuario_id} value={miembro.usuario_id}>
                {miembro.nombre}
                {miembro.es_responsable ? ' (responsable)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-tierra">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
          />
        </label>
        <label className="block text-xs font-semibold text-tierra">
          Orden en la ruta
          <input
            type="number"
            min={1}
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={enviando || Boolean(visita.llegada_en)}
        onClick={guardar}
        className="min-h-12 w-full rounded-pill bg-catedral px-5 text-sm font-semibold text-perla disabled:opacity-60"
      >
        {visita.llegada_en ? 'El técnico ya llegó' : asignada ? 'Reasignar' : 'Asignar visita'}
      </button>
    </article>
  );
}
