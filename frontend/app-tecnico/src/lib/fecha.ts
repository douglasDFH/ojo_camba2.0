/**
 * Fecha de hoy (YYYY-MM-DD) en la hora del dispositivo. `toISOString()` da la
 * fecha UTC: en Bolivia (UTC-4), después de las 20:00 ya sería "mañana".
 */
export function hoyLocal(): string {
  const ahora = new Date();
  const zona = ahora.getTimezoneOffset() * 60_000;
  return new Date(ahora.getTime() - zona).toISOString().slice(0, 10);
}
