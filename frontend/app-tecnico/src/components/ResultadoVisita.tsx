import { useState } from 'react';
import { EstadoCaso, puedeTransicionarCaso } from '@ojo-camba/common/estado-caso';
import { proponerResultado, type EstadoPropuesto } from '../lib/tecnicoApi';
import { CATEGORIA_NAMES } from '../lib/categories';
import { friendlyError } from '../lib/errors';
import FotoEvidencia from './FotoEvidencia';

interface Opcion {
  estado: EstadoPropuesto;
  titulo: string;
  detalle: string;
  /** Lo confirma otra persona antes de aplicarse. */
  terminal: boolean;
}

const OPCIONES: Opcion[] = [
  {
    estado: 'EnTrabajo',
    titulo: 'Empezamos el trabajo',
    detalle: 'La obra sigue: queda otra visita de seguimiento para ti.',
    terminal: false,
  },
  {
    estado: 'Reencolado',
    titulo: 'No se pudo trabajar hoy',
    detalle: 'El caso vuelve a tu responsable para que lo reprograme.',
    terminal: false,
  },
  {
    estado: 'Finalizado',
    titulo: 'Trabajo terminado',
    detalle: 'Requiere foto. Lo confirma tu responsable de cuadrilla.',
    terminal: true,
  },
  {
    estado: 'Derivado',
    titulo: 'Le corresponde a otra entidad',
    detalle: 'Requiere foto y la entidad. Lo confirma tu responsable.',
    terminal: true,
  },
  {
    estado: 'RechazadoCampo',
    titulo: 'No hay nada que atender',
    detalle: 'Requiere foto. Lo confirma la coordinación operativa.',
    terminal: true,
  },
];

/** El técnico propone el resultado de su visita; solo se ofrecen transiciones válidas. */
export default function ResultadoVisita({
  visitaId,
  estadoCaso,
  onEnviado,
}: {
  visitaId: number;
  estadoCaso: string;
  onEnviado: (mensaje: string) => void;
}) {
  const disponibles = OPCIONES.filter((opcion) =>
    puedeTransicionarCaso(estadoCaso as EstadoCaso, opcion.estado as EstadoCaso),
  );
  const [estado, setEstado] = useState<EstadoPropuesto | null>(null);
  const [comentario, setComentario] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [entidad, setEntidad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const elegida = OPCIONES.find((opcion) => opcion.estado === estado);

  if (disponibles.length === 0) {
    return (
      <p className="mt-3 text-sm text-arena">
        Desde el estado {estadoCaso} no hay un resultado que registrar en esta visita.
      </p>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elegida) return setError('Elige un resultado.');
    if (!comentario.trim()) return setError('Describe lo que encontraste.');
    if (elegida.terminal && !foto)
      return setError('Este resultado necesita una foto de evidencia.');
    if (estado === 'Derivado' && !entidad.trim())
      return setError('Indica a qué entidad se deriva.');
    if (estado === 'RechazadoCampo' && !categoria) return setError('Elige la categoría.');

    try {
      setEnviando(true);
      setError('');
      const respuesta = await proponerResultado(visitaId, {
        estado_propuesto: elegida.estado,
        comentario: comentario.trim(),
        evidencia_url: foto ?? undefined,
        entidad_destino: estado === 'Derivado' ? entidad.trim() : undefined,
        categoria_rechazo_id: estado === 'RechazadoCampo' ? Number(categoria) : undefined,
      });
      onEnviado(
        respuesta.requiere_confirmacion === false
          ? `Listo: el caso pasó a ${elegida.estado}.`
          : 'Propuesta enviada. Queda pendiente hasta que la confirmen.',
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="mt-4 space-y-3">
      <fieldset className="space-y-2">
        <legend className="sr-only">Resultado</legend>
        {disponibles.map((opcion) => (
          <label
            key={opcion.estado}
            className={`flex cursor-pointer gap-3 rounded-2xl border p-3 ${
              estado === opcion.estado ? 'border-selva bg-lienzo' : 'border-arcilla'
            }`}
          >
            <input
              type="radio"
              name="resultado"
              value={opcion.estado}
              checked={estado === opcion.estado}
              onChange={() => setEstado(opcion.estado)}
              className="mt-1 accent-selva"
            />
            <span>
              <span className="block text-sm font-semibold text-catedral">{opcion.titulo}</span>
              <span className="block text-xs text-arena">{opcion.detalle}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {elegida && (
        <>
          <label className="block text-xs font-semibold text-tierra">
            Qué encontraste
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-2xl border border-arcilla bg-lienzo p-3 text-sm text-catedral"
            />
          </label>
          {estado === 'Derivado' && (
            <label className="block text-xs font-semibold text-tierra">
              Entidad a la que se deriva
              <input
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                placeholder="Ej.: CRE, SAGUAPAC"
                className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
              />
            </label>
          )}
          {estado === 'RechazadoCampo' && (
            <label className="block text-xs font-semibold text-tierra">
              Categoría del problema (para el indicador de calidad)
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
              >
                <option value="">Elegir…</option>
                {Object.entries(CATEGORIA_NAMES).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <FotoEvidencia
            valor={foto}
            onCambio={setFoto}
            etiqueta="Foto de evidencia"
            obligatoria={elegida.terminal}
          />
        </>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando || !elegida}
        className="min-h-12 w-full rounded-pill bg-selva px-5 text-sm font-semibold text-perla disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Registrar resultado'}
      </button>
    </form>
  );
}
