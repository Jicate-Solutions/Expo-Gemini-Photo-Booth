/**
 * Certificates drawn in the browser on a canvas (no server needed, works on any phone):
 *  - Pledge certificate   (plan §6 Section E: "checkbox, digital certificate generated")
 *  - Reels contest certificate (§5.6 "Certificates for all valid entries", §7 screen 10)
 */
import { PLEDGE_TEXT } from '@/lib/reels';

const W = 1600;
const H = 1131; // A4 landscape ratio
const FONT = '"Noto Sans Tamil", "Nirmala UI", "Latha", system-ui, sans-serif';

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
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 20);
}

/** Cream page, gradient + green borders, the 3 partner logos. */
async function drawFrame(ctx: CanvasRenderingContext2D) {
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
}

/** Name in large type with an underline, centred at y. */
function drawName(ctx: CanvasRenderingContext2D, name: string, y: number) {
  ctx.fillStyle = '#0f172a';
  fitText(ctx, name, W - 320, 84, '800');
  ctx.fillText(name, W / 2, y);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 420, y + 30);
  ctx.lineTo(W / 2 + 420, y + 30);
  ctx.stroke();
}

function drawFooter(ctx: CanvasRenderingContext2D, code: string) {
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.fillText('Erode Marathon 2026 · 22 November 2026 · Erode', W / 2, 900);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText('Young Indians (Yi) · JKKN · Erode Runners', W / 2, 945);
  ctx.fillText(code, W / 2, 1010);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

function newCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  return { canvas, ctx: canvas.getContext('2d') };
}

export async function makePledgeCertificate(name: string, code: string): Promise<Blob | null> {
  const { canvas, ctx } = newCanvas();
  if (!ctx) return null;
  await drawFrame(ctx);

  ctx.fillStyle = '#be185d';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText('CERTIFICATE OF PLEDGE', W / 2, 300);
  ctx.fillStyle = '#047857';
  fitText(ctx, 'போதையில்லா தமிழ்நாடு · Drug-Free Tamil Nadu', W - 300, 36, '700');
  ctx.fillText('போதையில்லா தமிழ்நாடு · Drug-Free Tamil Nadu', W / 2, 355);

  ctx.fillStyle = '#475569';
  ctx.font = '400 32px system-ui, sans-serif';
  ctx.fillText('This is to certify that', W / 2, 440);
  drawName(ctx, name, 545);
  ctx.fillStyle = '#475569';
  ctx.font = '400 32px system-ui, sans-serif';
  ctx.fillText('has taken the pledge', W / 2, 640);

  ctx.fillStyle = '#9d174d';
  fitText(ctx, `“${PLEDGE_TEXT.ta}”`, W - 260, 50, '700');
  ctx.fillText(`“${PLEDGE_TEXT.ta}”`, W / 2, 730);
  ctx.fillStyle = '#334155';
  ctx.font = 'italic 400 34px system-ui, sans-serif';
  ctx.fillText(`(${PLEDGE_TEXT.en})`, W / 2, 790);

  drawFooter(ctx, code);
  return toBlob(canvas);
}

/**
 * Reels contest certificate. `prizeTitle` (e.g. "1st Prize", "Best Student Reel") makes it a
 * winner's certificate; without it, a certificate of participation for a valid entry.
 */
export async function makeReelCertificate(name: string, code: string, prizeTitle: string | null): Promise<Blob | null> {
  const { canvas, ctx } = newCanvas();
  if (!ctx) return null;
  await drawFrame(ctx);

  ctx.fillStyle = '#be185d';
  ctx.font = '800 60px system-ui, sans-serif';
  ctx.fillText(prizeTitle ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION', W / 2, 300);
  ctx.fillStyle = '#047857';
  fitText(ctx, 'Impact Reel Challenge · போதையில்லா தமிழ்நாடு', W - 300, 36, '700');
  ctx.fillText('Impact Reel Challenge · போதையில்லா தமிழ்நாடு', W / 2, 355);

  ctx.fillStyle = '#475569';
  ctx.font = '400 32px system-ui, sans-serif';
  ctx.fillText('This is to certify that', W / 2, 440);
  drawName(ctx, name, 545);

  if (prizeTitle) {
    ctx.fillStyle = '#475569';
    ctx.font = '400 32px system-ui, sans-serif';
    ctx.fillText('has won', W / 2, 640);
    // Prize ribbon
    ctx.font = '800 54px system-ui, sans-serif';
    const tw = ctx.measureText(prizeTitle).width + 120;
    const rg = ctx.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
    rg.addColorStop(0, '#f59e0b');
    rg.addColorStop(1, '#ea580c');
    ctx.fillStyle = rg;
    ctx.beginPath();
    // roundRect is missing on older phones — plain rectangle there
    if (typeof ctx.roundRect === 'function') ctx.roundRect(W / 2 - tw / 2, 672, tw, 86, 43);
    else ctx.rect(W / 2 - tw / 2, 672, tw, 86);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(prizeTitle, W / 2, 735);
    ctx.fillStyle = '#334155';
    ctx.font = '400 30px system-ui, sans-serif';
    ctx.fillText('in the Impact Reel Challenge for a Drug-Free Tamil Nadu', W / 2, 815);
  } else {
    ctx.fillStyle = '#475569';
    ctx.font = '400 32px system-ui, sans-serif';
    ctx.fillText('took part in the Impact Reel Challenge', W / 2, 640);
    ctx.fillStyle = '#9d174d';
    ctx.font = '700 40px system-ui, sans-serif';
    ctx.fillText('and spread the message of a Drug-Free Tamil Nadu', W / 2, 720);
    ctx.fillStyle = '#334155';
    ctx.font = 'italic 400 30px system-ui, sans-serif';
    ctx.fillText('Thank you for running for a cause.', W / 2, 790);
  }

  drawFooter(ctx, code);
  return toBlob(canvas);
}
