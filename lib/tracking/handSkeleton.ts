import type { Landmark } from "./gestureRecognizer";

export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];

/**
 * Draw hand landmarks and bone connections on a 2D canvas
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  isMirrored = true,
  handIndex = 0
): void {
  if (!landmarks || landmarks.length < 21) return;

  const toScreen = (lm: Landmark) => {
    const x = (isMirrored ? 1 - lm.x : lm.x) * width;
    const y = lm.y * height;
    return { x, y };
  };

  // Bone line style
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Bones
  for (const [start, end] of HAND_CONNECTIONS) {
    const p1 = toScreen(landmarks[start]);
    const p2 = toScreen(landmarks[end]);

    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    if (handIndex === 0) {
      grad.addColorStop(0, "rgba(0, 242, 254, 0.75)"); // cyan
      grad.addColorStop(1, "rgba(121, 40, 202, 0.85)"); // violet
    } else {
      grad.addColorStop(0, "rgba(255, 0, 128, 0.75)"); // magenta
      grad.addColorStop(1, "rgba(255, 128, 0, 0.85)"); // amber
    }

    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Landmark joints
  for (let i = 0; i < landmarks.length; i++) {
    const p = toScreen(landmarks[i]);
    const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
    const isWrist = i === 0;

    const radius = isTip ? 6.5 : isWrist ? 7.0 : 4.5;

    // Outer glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 242, 254, 0.3)";
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isTip
      ? "#ffffff"
      : isWrist
      ? "#00f2fe"
      : handIndex === 0
      ? "#7928ca"
      : "#ff0080";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

