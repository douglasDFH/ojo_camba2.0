import { Camera, X } from 'lucide-react';
import { useId, useState } from 'react';
import { leerFotoComprimida } from '../lib/imagen';

/** Botón de cámara con vista previa; entrega la foto ya comprimida como data URL. */
export default function FotoEvidencia({
  valor,
  onCambio,
  etiqueta,
  obligatoria = false,
}: {
  valor: string | null;
  onCambio: (foto: string | null) => void;
  etiqueta: string;
  obligatoria?: boolean;
}) {
  const inputId = useId();
  const [error, setError] = useState('');

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      setError('');
      onCambio(await leerFotoComprimida(archivo));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      {valor ? (
        <div className="relative inline-block">
          <img src={valor} alt="Foto adjunta" className="h-28 w-28 rounded-2xl object-cover" />
          <button
            type="button"
            onClick={() => onCambio(null)}
            aria-label="Quitar foto"
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-catedral text-perla"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-pill border border-arcilla px-4 text-sm font-semibold text-caoba"
        >
          <Camera className="h-4 w-4" />
          {etiqueta}
          {obligatoria && <span className="text-ladrillo">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={elegir}
      />
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
