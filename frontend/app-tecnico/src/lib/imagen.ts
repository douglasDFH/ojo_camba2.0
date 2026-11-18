/**
 * Lee una foto de la cámara y la reduce antes de enviarla: una foto de celular
 * pesa varios MB y el gateway acepta hasta 10 MB por petición. Se escala al
 * lado mayor de 1600 px y se codifica como JPEG.
 */
export async function leerFotoComprimida(archivo: File, ladoMaximo = 1600): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error('No se pudo leer la foto.'));
    lector.readAsDataURL(archivo);
  });

  const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
    img.src = original;
  });

  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}
