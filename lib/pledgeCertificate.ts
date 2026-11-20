/**
 * Drug-Free TN pledge certificate (plan §6, Section E: "checkbox, digital certificate generated").
 * Drawn in the browser on a canvas, so it needs no server and works for every participant.
 */
import { PLEDGE_TEXT } from '@/lib/reels';

const W = 1600;
const H = 1131; // A4 landscape ratio

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Shrinks the font until the text fits the given width. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, weight: string) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px "Noto Sans Tamil", "Nirmala UI", "Latha", system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 20);
}

export async function makePledgeCertificate(name: string, code: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background + double border
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, W, H);
  const band = ctx.createLinearGradient(0, 0, W, 0);
  band.addColorStop(0, '#c026d3');
  band.addColorStop(0.5, '#ec4899');
  band.addColorStop(1, '#fb923c');
  ctx.strokeStyle = band;
  ctx.lineWidth = 22;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.strokeRect(62, 62, W - 124, H - 124);

  // Partner logos: Yi | JKKN | Erode Runners
  const logos = await Promise.all([
    loadImage('/marathon/yi-logo.png'),
    loadImage('/jkkn-logo.png'),
    loadImage('/marathon/erode-runners-logo.png'),
  ]);
  const logoH = 96;
  const widths = logos.map(l => (l ? (l.width / l.height) * logoH : 0));
  const gap = 60;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (logos.filter(Boolean).length - 1);
  let x = (W - total) / 2;
  logos.forEach((l, i) => {
    if (!l) return;
    ctx.drawImage(l, x, 105, widths[i], logoH);
    x += widths[i] + gap;
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#be185d';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText('CERTIFICATE OF PLEDGE', W / 2, 300);
  ctx.fillStyle = '#047857';
  fitText(ctx, 'போதையில்லா தமிழ்நாடு · Drug-Free Tamil Nadu', W - 300, 36, '700');
  ctx.fillText('போதையில்லா தமிழ்நாடு · Drug-Free Tamil Nadu', W / 2, 355);

  ctx.fillStyle = '#475569';
  ctx.font = '400 32px system-ui, sans-serif';
  ctx.fillText('This is to certify that', W / 2, 440);

  ctx.fillStyle = '#0f172a';
  fitText(ctx, name, W - 320, 84, '800');
  ctx.fillText(name, W / 2, 545);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 420, 575);
  ctx.lineTo(W / 2 + 420, 575);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '400 32px system-ui, sans-serif';
  ctx.fillText('has taken the pledge', W / 2, 640);

  ctx.fillStyle = '#9d174d';
  fitText(ctx, `“${PLEDGE_TEXT.ta}”`, W - 260, 50, '700');
  ctx.fillText(`“${PLEDGE_TEXT.ta}”`, W / 2, 730);
  ctx.fillStyle = '#334155';
  ctx.font = 'italic 400 34px system-ui, sans-serif';
  ctx.fillText(`(${PLEDGE_TEXT.en})`, W / 2, 790);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.fillText('Erode Marathon 2026 · 22 November 2026 · Erode', W / 2, 900);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText('Young Indians (Yi) · JKKN · Erode Runners', W / 2, 945);
  ctx.fillText(code, W / 2, 1010);

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}
