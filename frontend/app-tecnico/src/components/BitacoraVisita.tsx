import { useState } from 'react';
import { addActualizacion } from '../lib/tecnicoApi';
import { friendlyError } from '../lib/errors';
import FotoEvidencia from './FotoEvidencia';

/** Agrega un avance a la bitácora pública del caso, sin cambiar su estado. */
export default function BitacoraVisita({
  grupoId,
  onGuardado,
}: {
  grupoId: number;
  onGuardado: () => void;
}) {
  const [comentario, setComentario] = useState('');
  const [recursos, setRecursos] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) {
      setError('Escribe qué se hizo o qué falta.');
      return;
    }
    try {
      setEnviando(true);
      setError('');
      await addActualizacion(grupoId, {
        comentario: comentario.trim(),
        recursos_solicitados: recursos.trim() || undefined,
        url_imagen: foto ?? undefined,
      });
      setComentario('');
      setRecursos('');
      setFoto(null);
      onGuardado();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="mt-4 space-y-3">
      <label className="block text-xs font-semibold text-tierra">
        Avance
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          placeholder="Ej.: se retiró el escombro y se delimitó la zona."
          className="mt-1 w-full rounded-2xl border border-arcilla bg-lienzo p-3 text-sm text-catedral"
        />
      </label>
      <label className="block text-xs font-semibold text-tierra">
        Materiales o maquinaria que faltan (opcional)
        <input
          value={recursos}
          onChange={(e) => setRecursos(e.target.value)}
          placeholder="Ej.: 2 bolsas de asfalto frío"
          className="mt-1 min-h-11 w-full rounded-2xl border border-arcilla bg-lienzo px-3 text-sm text-catedral"
        />
      </label>
      <FotoEvidencia valor={foto} onCambio={setFoto} etiqueta="Adjuntar foto" />
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="min-h-12 w-full rounded-pill bg-catedral px-5 text-sm font-semibold text-perla disabled:opacity-60"
      >
        {enviando ? 'Guardando…' : 'Agregar a la bitácora'}
      </button>
    </form>
  );
}
