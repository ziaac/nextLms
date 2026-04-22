/** Convert "HH:mm" → total menit */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** True jika dua interval waktu BERIRISAN (strict, endpoint-exclusive) */
export function isTimeOverlap(
  startA: string, endA: string,
  startB: string, endB: string,
): boolean {
  return toMinutes(startA) < toMinutes(endB) &&
         toMinutes(startB) < toMinutes(endA)
}
