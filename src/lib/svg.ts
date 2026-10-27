/**
 * A smooth curve through every point: Catmull–Rom, written out as cubic
 * Béziers so it drops straight into an SVG `d`.
 *
 * For the segment p1→p2 with neighbours p0 and p3 (the ends repeat themselves),
 * the control points sit a sixth of the way along the neighbours' chords:
 *   c1 = p1 + (p2 − p0) / 6,  c2 = p2 − (p3 − p1) / 6
 * which makes the curve pass through every point with no overshoot past the
 * data on a chart.
 */
export function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return "";
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r(c1x)} ${r(c1y)},${r(c2x)} ${r(c2y)},${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}
