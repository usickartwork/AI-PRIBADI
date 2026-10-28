export function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): (t: number) => number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t: number) {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t;
  }

  function sampleCurveDerivativeX(t: number) {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  function solveCurveX(x: number, epsilon = 1e-6) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xCurrent = sampleCurveX(t) - x;
      if (Math.abs(xCurrent) < epsilon) return t;
      const d = sampleCurveDerivativeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= xCurrent / d;
    }

    let t0 = 0.0;
    let t1 = 1.0;
    t = x;

    if (t < t0) return t0;
    if (t > t1) return t1;

    while (t0 < t1) {
      const xCurrent = sampleCurveX(t);
      if (Math.abs(xCurrent - x) < epsilon) return t;
      if (x > xCurrent) t0 = t;
      else t1 = t;
      t = (t1 - t0) * 0.5 + t0;
    }

    return t;
  }

  return function (x: number) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleCurveY(solveCurveX(x));
  };
}
