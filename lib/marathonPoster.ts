import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Erode Marathon 2026 poster.
 *
 * Flow: the AI (OpenAI by default, or Gemini) receives the visitor's photo + a poster template (public/marathon/erode-template.jpg)
 * and redraws the poster with the visitor as the runner. The template has its logo area blanked out,
 * and we stamp the REAL logos (Yi + green JKKN) onto the result afterwards, because AI-drawn logos
 * are never exact.
 */

// Final output size: 4x6 inch portrait at 300 DPI
export const POSTER_W = 1200;
export const POSTER_H = 1800;

// Logo card position, as fractions of the poster. Measured on the 942x1413 template,
// where the blanked logo area is x 538-838, y 170-288 (slightly enlarged so it fully
// covers whatever the AI drew there).
const CARD = { x0: 0.556, x1: 0.905, y0: 0.112, y1: 0.212 };

const TEMPLATE_PATH = 'marathon/erode-template.jpg';
const YI_LOGO_PATH = 'marathon/yi-logo.png';
const JKKN_LOGO_PATH = 'jkkn-logo.png';

/**
 * Read a file from /public. Falls back to fetching it over HTTP from the app's own origin,
 * because serverless deployments (e.g. Vercel) don't always bundle /public into functions.
 */
async function readPublicAsset(relPath: string, origin: string): Promise<Buffer> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'public', relPath));
  } catch {
    const res = await fetch(`${origin}/${relPath}`);
    if (!res.ok) throw new Error(`Could not load asset ${relPath} (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export async function getMarathonTemplateDataUrl(origin: string): Promise<string> {
  const buf = await readPublicAsset(TEMPLATE_PATH, origin);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/** Keep only safe bib characters (digits/letters, max 8) so user input can't alter the prompt. */
export function sanitizeBib(input: unknown): string {
  return String(input ?? '').replace(/[^0-9A-Za-z]/g, '').slice(0, 8).toUpperCase();
}

/**
 * T-shirt colours, one picked at random per poster so every runner's poster looks different.
 * Orange/yellow are left out on purpose: they'd blend into the orange "DRUG-FREE LIFE" ribbon.
 * White/very light colours are left out so the white Yi logo on the chest stays visible.
 */
export const TSHIRT_COLORS = [
  'royal blue',
  'crimson red',
  'emerald green',
  'black',
  'deep purple',
  'teal',
  'maroon',
  'navy blue',
  'sky blue',
  'magenta pink',
  'charcoal grey',
] as const;

export type RunnerGender = 'male' | 'female';

export function sanitizeGender(input: unknown): RunnerGender | undefined {
  return input === 'male' || input === 'female' ? input : undefined;
}

export function buildMarathonPosterPrompt(bibNumber?: string, gender?: RunnerGender): string {
  // Runner's real bib from the details form; random 4-digit fallback if missing
  const bib = sanitizeBib(bibNumber) || String(1000 + Math.floor(Math.random() * 9000));
  // New colour every generation (also on "Retake Selfie")
  const color = TSHIRT_COLORS[Math.floor(Math.random() * TSHIRT_COLORS.length)];

  const outfit =
    gender === 'female'
      ? [
          `- Outfit: a ${color} short-sleeved women's athletic t-shirt (regular sleeves — NOT sleeveless, NOT a tank top, NOT a crop top) with the white "Yi Young Indians" logo on the chest,`,
          '  full-length black athletic TRACK PANTS (joggers) with a thin white side stripe, reaching down to the ankles — NOT shorts, NOT a skirt —',
          '  and running shoes. The outfit is modest and sporty.',
        ].join('\n')
      : `- Outfit: a ${color} short-sleeved athletic t-shirt with the white "Yi Young Indians" logo on the chest, navy blue running shorts, black socks, running shoes.`;

  return [
    'You are given two images.',
    'IMAGE 1 is a photo of a real person (the visitor).',
    'IMAGE 2 is a marathon poster template ("Erode Marathon 2026").',
    '',
    'TASK: Recreate IMAGE 2 exactly — same layout, same composition, same colours, same text — but replace the runner in the poster with the person from IMAGE 1.',
    '',
    'FACE & IDENTITY — HIGHEST PRIORITY:',
    '- The runner\'s face MUST be the face from IMAGE 1. Copy it faithfully: same face shape, eyes, eyebrows, nose, lips, ears, jawline, skin tone and complexion, facial hair (or lack of it), glasses if worn, and hairstyle / hair length / head covering.',
    '- Keep the person\'s age, gender and build as they appear in IMAGE 1.',
    '- Do NOT use, blend or borrow the face, hair or skin tone of the man shown in IMAGE 2 — that runner is only a placeholder for pose and placement.',
    '- Do not beautify, slim, whiten/lighten skin, change ethnicity, add make-up, or cartoonify. Friends and family must instantly recognise this exact person.',
    '',
    'THE RUNNER (the person from IMAGE 1):',
    '- Natural, happy, proud smile with a relaxed mouth (not wide open, not shouting) — keep their own teeth and smile shape.',
    '- Same pose and placement as the poster runner: full body from head to shoes, running towards the camera, right fist raised high in victory, left arm bent at the side, standing in the centre-left of the poster.',
    '- Scale the person so they fill the same space as the original runner, with realistic body proportions — the head must match the body size, nothing stretched or squashed, and the body must look naturally attached (not a pasted-on head).',
    outfit,
    `- The t-shirt colour MUST be ${color} (not the blue from the template).`,
    '- Gold finisher medal on a tricolour (orange-white-blue) ribbon around the neck.',
    `- White race bib with an orange top stripe on the t-shirt showing ONLY the number "${bib}" in bold black.`,
    '- Match the lighting and colour of the person to the poster so they blend in naturally.',
    '',
    'KEEP FROM THE POSTER, EXACTLY AS IN IMAGE 2:',
    '- The orange ribbon banner across the runner\'s waist reading "I CHOOSE A DRUG-FREE LIFE!" (the ribbon goes IN FRONT of the runner\'s body).',
    '- "DRUG-FREE TAMIL NADU" and "Our Run. Our Responsibility." on the right.',
    '- The Tamil Nadu map with the "ERODE" location pin and the Erode clock-tower building.',
    '- The runner silhouettes, the blue road, and the "ERODE MARATHON 2026" / "RUN FOR HEALTH. RUN FOR LIFE." panel at the bottom.',
    '- The white cut-out standee shape with the white background around it.',
    '- Spell every piece of text exactly as written above.',
    '',
    'IMPORTANT: In the top-right corner there is a plain white rounded box. Leave it completely EMPTY and WHITE — do not draw any logo, text or graphic inside it (official logos are added later).',
    '',
    'Output: one high-resolution, sharp, photorealistic-person poster image in portrait 2:3 orientation, same framing as IMAGE 2.',
  ].join('\n');
}

/** Normalise the AI output to 1200x1800 and stamp the real Yi | JKKN logos in the top-right card. */
export async function stampMarathonLogos(aiImageBase64: string, origin: string): Promise<string> {
  const [yiBuf, jkknBuf] = await Promise.all([
    readPublicAsset(YI_LOGO_PATH, origin),
    readPublicAsset(JKKN_LOGO_PATH, origin),
  ]);

  const poster = await sharp(Buffer.from(aiImageBase64, 'base64'))
    .resize(POSTER_W, POSTER_H, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const cardX = Math.round(POSTER_W * CARD.x0);
  const cardY = Math.round(POSTER_H * CARD.y0);
  const cardW = Math.round(POSTER_W * (CARD.x1 - CARD.x0));
  const cardH = Math.round(POSTER_H * (CARD.y1 - CARD.y0));
  const radius = Math.round(cardH * 0.22);

  // White rounded card with a soft shadow, covering whatever the AI drew there
  const SHADOW = 10;
  const cardSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW + SHADOW * 2}" height="${cardH + SHADOW * 2}">
      <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/></filter></defs>
      <rect x="${SHADOW}" y="${SHADOW}" width="${cardW}" height="${cardH}" rx="${radius}" ry="${radius}"
        fill="#ffffff" stroke="#e5e7eb" stroke-width="2" filter="url(#s)"/>
    </svg>`,
  );

  // Logo layout inside the card:  [ Yi ]  |  [ JKKN ]
  const pad = Math.round(cardH * 0.12);
  const innerH = cardH - pad * 2;
  const gap = Math.round(cardW * 0.06);
  const dividerW = 3;
  const innerW = cardW - pad * 2;
  const halfW = Math.floor((innerW - gap * 2 - dividerW) / 2);

  const yi = await sharp(yiBuf).resize(halfW, innerH, { fit: 'inside' }).png().toBuffer();
  const jkkn = await sharp(jkknBuf).resize(halfW, Math.round(innerH * 0.92), { fit: 'inside' }).png().toBuffer();
  const [yiMeta, jkknMeta] = await Promise.all([sharp(yi).metadata(), sharp(jkkn).metadata()]);

  const leftCenterX = cardX + pad + halfW / 2;
  const rightCenterX = cardX + pad + halfW + gap * 2 + dividerW + halfW / 2;
  const centerY = cardY + cardH / 2;

  const divider = await sharp({
    create: { width: dividerW, height: Math.round(innerH * 0.8), channels: 4, background: '#1e2a5a' },
  }).png().toBuffer();

  const out = await sharp(poster)
    .composite([
      { input: cardSvg, left: cardX - SHADOW, top: cardY - SHADOW },
      { input: yi, left: Math.round(leftCenterX - yiMeta.width! / 2), top: Math.round(centerY - yiMeta.height! / 2) },
      { input: divider, left: cardX + pad + halfW + gap, top: Math.round(centerY - (innerH * 0.8) / 2) },
      { input: jkkn, left: Math.round(rightCenterX - jkknMeta.width! / 2), top: Math.round(centerY - jkknMeta.height! / 2) },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return `data:image/jpeg;base64,${out.toString('base64')}`;
}
