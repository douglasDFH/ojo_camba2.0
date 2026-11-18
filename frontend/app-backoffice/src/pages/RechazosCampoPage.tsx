import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  confirmarRechazoCampo,
  descartarRechazoCampo,
  listRechazosCampo,
  type RechazoCampoPendiente,
} from '../lib/excepcionesApi';
import { CATEGORIA_NAMES } from '../lib/categories';
import { friendlyError } from '../lib/errors';

/**
 * Bandeja de la coordinación operativa: un técnico propone cerrar un caso
 * porque en campo no hay nada que atender. Confirmarlo cierra el caso como
 * RechazadoCampo (cuenta en el indicador de calidad de la moderación);
 * descartarlo devuelve la visita al técnico.
 */
export default function RechazosCampoPage() {
  const [pendientes, setPendientes] = useState<RechazoCampoPendiente[] | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(() => {
    listRechazosCampo()
      .then(setPendientes)
      .catch((err) => setError(friendlyError(err)));
  }, []);

  useEffect(cargar, [cargar]);

  const hecho = (mensaje: string) => {
    setAviso(mensaje);
    setError('');
    cargar();
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-xl text-tierra">Rechazos de campo</h2>
          <p className="text-sm text-arena mt-0.5">
            Casos que un técnico propone cerrar porque en el lugar no hay nada que atender.
          </p>
        </div>
        <button
          onClick={cargar}
          aria-label="Actualizar rechazos"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-caoba hover:text-tierra hover:bg-yeso transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {aviso && (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-2xl bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {pendientes === null && !error && (
        <div className="h-32 animate-pulse rounded-3xl-3 bg-perla" aria-busy="true" />
      )}
      {pendientes?.length === 0 && (
        <div className="flex items-center gap-3 rounded-3xl-3 border border-arcilla bg-perla p-5 text-sm text-arena">
          <ShieldAlert className="h-5 w-5 text-arena" />
          No hay rechazos de campo esperando decisión.
        </div>
      )}

      <div className="space-y-4">
        {pendientes?.map((rechazo) => (
          <TarjetaRechazo key={rechazo.id} rechazo={rechazo} onHecho={hecho} onError={setError} />
        ))}
      </div>
    </div>
  );
}

function TarjetaRechazo({
  rechazo,
  onHecho,
  onError,
}: {
  rechazo: RechazoCampoPendiente;
  onHecho: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const codigo = rechazo.caso?.codigo_obra ?? `visita ${rechazo.visita_id}`;

  const decidir = async (accion: 'confirmar' | 'descartar') => {
    if (accion === 'descartar' && !motivo.trim()) {
      onError('Para descartar, escribe el motivo: el técnico lo verá en la bitácora.');
      return;
    }
    try {
      setEnviando(true);
      if (accion === 'confirmar') {
        await confirmarRechazoCampo(rechazo.id, motivo.trim() || undefined);
        onHecho(`Caso ${codigo} cerrado como rechazo de campo.`);
      } else {
        await descartarRechazoCampo(rechazo.id, motivo.trim());
        onHecho(`Rechazo de ${codigo} descartado: la visita vuelve al técnico.`);
      }
    } catch (err) {
      onError(friendlyError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article className="rounded-3xl-3 border border-arcilla bg-perla p-5 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {rechazo.caso ? (
          <Link
            to={`/casos/${rechazo.caso.id}`}
            className="font-semibold text-tierra hover:text-caoba"
          >
            {codigo}
          </Link>
        ) : (
          <span className="font-semibold text-tierra">{codigo}</span>
        )}
        <span className="text-xs text-arena">
          Propuesto por {rechazo.tecnico_nombre ?? 'un técnico'} el{' '}
          {new Date(rechazo.creado_en).toLocaleDateString('es-BO')}
        </span>
      </div>
      <p className="text-sm text-tierra">{rechazo.comentario}</p>
      {rechazo.categoria_rechazo_id != null && (
        <p className="text-xs text-arena">
          Categoría: {CATEGORIA_NAMES[rechazo.categoria_rechazo_id] ?? rechazo.categoria_rechazo_id}
        </p>
      )}
      {rechazo.evidencia_url && (
        <p className="text-xs text-arena">La foto de evidencia está en la bitácora del caso.</p>
      )}
      <label className="block text-xs font-semibold text-tierra">
        Motivo de la decisión (obligatorio para descartar)
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => decidir('descartar')}
          className="min-h-11 rounded-pill border border-arcilla px-5 text-sm font-semibold text-caoba disabled:opacity-60"
        >
          Descartar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => decidir('confirmar')}
          className="min-h-11 rounded-pill bg-catedral px-5 text-sm font-semibold text-perla disabled:opacity-60"
        >
          Confirmar rechazo
        </button>
      </div>
    </article>
  );
}
