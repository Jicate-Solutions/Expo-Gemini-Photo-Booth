import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { TSHIRT_COLORS, findTshirtColor, defaultBottomWear, type BottomWear } from './marathonOptions';

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
// This is the white "bump" panel at the top-right of the standee.
const CARD = { x0: 0.556, x1: 0.905, y0: 0.112, y1: 0.212 };

/** Logo card size relative to the bump panel (1 = fills it edge to edge). */
const LOGO_CARD_SCALE = 0.78;
/** White clean-up patch under the card, relative to the bump — inset so the bump's outline stays visible. */
const CLEAN_SCALE = 0.9;

const TEMPLATE_PATH = 'marathon/erode-template.jpg';
const YI_LOGO_PATH = 'marathon/yi-logo.png';
const JKKN_LOGO_PATH = 'jkkn-logo.png';
const ERODE_RUNNERS_LOGO_PATH = 'marathon/erode-runners-logo.png';

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

export type RunnerGender = 'male' | 'female';

export function sanitizeGender(input: unknown): RunnerGender | undefined {
  return input === 'male' || input === 'female' ? input : undefined;
}

/** Name to print on the runner's legwear: first name only, letters only, max 12 chars, uppercase. */
export function sanitizePrintName(input: unknown): string {
  const words = String(input ?? '')
    .split(/[\s.]+/)
    .map(w => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);
  // Skip initials ("S. Ramesh", "K Arun", "RK Priya") — use the first real name of 3+ letters
  const name = words.find(w => w.length >= 3) || words[0] || '';
  return name.slice(0, 12).toUpperCase();
}

export interface MarathonPosterOptions {
  bibNumber?: string;
  gender?: RunnerGender;
  /** Printed on the runner's bottom wear (first real name only) */
  runnerName?: string;
  /** true when a second, full-body photo is sent (images: 1 = face, 2 = body, 3 = template) */
  hasBodyPhoto?: boolean;
  /** Colour id from TSHIRT_COLORS; anything else (or 'random') = a random colour each poster */
  tshirtColor?: string;
  /** Defaults by gender: women track pants, men shorts */
  bottomWear?: BottomWear;
}

export function buildMarathonPosterPrompt({
  bibNumber,
  gender,
  runnerName,
  hasBodyPhoto = false,
  tshirtColor,
  bottomWear,
}: MarathonPosterOptions = {}): string {
  const printName = sanitizePrintName(runnerName);
  // Runner's real bib from the details form; random 4-digit fallback if missing
  const bib = sanitizeBib(bibNumber) || String(1000 + Math.floor(Math.random() * 9000));
  // The runner's chosen colour, or a new random one every generation ("Surprise me")
  const color = (findTshirtColor(tshirtColor) ?? TSHIRT_COLORS[Math.floor(Math.random() * TSHIRT_COLORS.length)]).prompt;
  const bottom: BottomWear = bottomWear ?? defaultBottomWear(gender);

  const top =
    gender === 'female'
      ? `a ${color} short-sleeved women's athletic t-shirt (regular sleeves — NOT sleeveless, NOT a tank top, NOT a crop top) with the white "Yi Young Indians" logo on the chest`
      : `a ${color} short-sleeved athletic t-shirt with the white "Yi Young Indians" logo on the chest`;
  const bottomText =
    bottom === 'track_pants'
      ? 'full-length black athletic TRACK PANTS (joggers) with a thin white side stripe, reaching down to the ankles — NOT shorts, NOT a skirt'
      : 'navy blue athletic running SHORTS (above the knee) with black socks — NOT track pants';
  const outfit = [
    `- Outfit: ${top},`,
    `  ${bottomText},`,
    `  and running shoes. The outfit is ${gender === 'female' ? 'modest and ' : ''}sporty.`,
  ].join('\n');
  const bottomName = bottom === 'track_pants' ? 'track pants' : 'running shorts';

  const prompt = [
    'You are given two images.',
    'IMAGE 1 is a photo of a real person (the visitor).',
    'IMAGE 2 is a marathon poster template ("Erode Marathon 2026").',
    '',
    'TASK: Recreate the artwork of IMAGE 2 — same layout, same composition, same colours, same text — but replace the runner with the person from IMAGE 1.',
    'IMAGE 2 is a photo of a physical cut-out standee. Do NOT reproduce it as a physical object: the result must be a FLAT, full-bleed digital poster (see POSTER STYLE below).',
    '',
    'FACE & IDENTITY — HIGHEST PRIORITY:',
    '- The runner\'s face MUST be the face from IMAGE 1. Copy it faithfully: same face shape, eyes, eyebrows, nose, lips, ears, jawline, skin tone and complexion, facial hair (or lack of it), glasses if worn, and hairstyle / hair length / head covering.',
    '- Keep the person\'s age, gender and build as they appear in IMAGE 1.',
    '- Do NOT use, blend or borrow the face, hair or skin tone of the man shown in IMAGE 2 — that runner is only a placeholder for pose and placement.',
    '- Do not change the FACE: no beautifying, no slimming the face, no whitening/lightening skin, no change of ethnicity, no make-up, no cartoon look. Friends and family must instantly recognise this exact person.',
    '',
    'THE RUNNER (the person from IMAGE 1):',
    '- Natural, happy, proud smile with a relaxed mouth (not wide open, not shouting) — keep their own teeth and smile shape.',
    '- Same pose and placement as the poster runner: full body from head to shoes, running towards the camera, right fist raised high in victory, left arm bent at the side, standing in the centre-left of the poster.',
    '- Scale the person so they fill the same space as the original runner, with realistic body proportions — the head must match the body size, nothing stretched or squashed, and the body must look naturally attached (not a pasted-on head).',
    outfit,
    `- The t-shirt colour MUST be ${color} (not the blue from the template).`,
    '- Gold finisher medal on a tricolour (orange-white-blue) ribbon around the neck.',
    `- White race bib with an orange top stripe on the t-shirt showing ONLY the number "${bib}" in bold black.`,
    ...(printName
      ? [
          `- The runner's name "${printName}" is PRINTED on the ${bottomName}: bold white sporty capital letters running VERTICALLY down the outer side of the runner's LEFT leg (like a sportswear side print), clearly readable, spelled exactly "${printName}" — letter by letter: ${printName.split('').join('-')}.`,
          '- The name appears ONLY on the leg — nowhere else on the poster.',
        ]
      : []),
    '- Match the lighting and colour of the person to the poster so they blend in naturally.',
    '',
    'KEEP FROM THE POSTER, EXACTLY AS IN IMAGE 2:',
    '- The orange ribbon banner across the runner\'s waist reading "I CHOOSE A DRUG-FREE LIFE!" (the ribbon goes IN FRONT of the runner\'s body).',
    '- "DRUG-FREE TAMIL NADU" and "Our Run. Our Responsibility." on the right.',
    '- The Tamil Nadu map with the "ERODE" location pin and the Erode clock-tower building.',
    '- The runner silhouettes, the blue road, and the "ERODE MARATHON 2026" / "RUN FOR HEALTH. RUN FOR LIFE." panel at the bottom.',
    '- Spell every piece of text exactly as written above.',
    '',
    'POSTER STYLE — FLAT, FULL-BLEED:',
    '- The artwork fills the ENTIRE image edge to edge, like a printed poster or a social-media graphic.',
    '- NO cut-out standee shape, NO white outline or sticker border around the artwork, NO stand or base at the bottom, NO drop shadow, NO 3D / physical-object / product-photo look, NO empty white margins.',
    '- Extend the poster background all the way to the four edges: a clean light sky / white-to-light-blue background at the top, and the blue road + runner silhouettes running right to the bottom and side edges.',
    '- Keep every element in roughly the same position and size as in IMAGE 2.',
    '',
    'IMPORTANT: In the top-right corner there is a plain white rounded box. Leave it completely EMPTY and WHITE — do not draw any logo, text or graphic inside it (official logos are added later).',
    '',
    'Output: one high-resolution, sharp, flat full-bleed poster image (photorealistic person) in portrait 2:3 orientation.',
  ].join('\n');

  return hasBodyPhoto ? withBodyPhoto(prompt) : prompt;
}

/**
 * Rewrite the face-only prompt for 3 input images: 1 = face close-up, 2 = full-body photo, 3 = template.
 * The body photo gives the AI the runner's real build, so it doesn't have to guess (and slim) it.
 */
function withBodyPhoto(prompt: string): string {
  return prompt
    .replace(/IMAGE 2/g, 'IMAGE 3')
    .replace('You are given two images.', 'You are given three images.')
    .replace(
      'IMAGE 1 is a photo of a real person (the visitor).',
      "IMAGE 1 is a close-up photo of a real person's face (the visitor).\n" +
        'IMAGE 2 is a full-body photo of the SAME person (use it for their body shape only).',
    )
    .replace(
      "- Keep the person's age, gender and build as they appear in IMAGE 1.",
      [
        "- Keep the person's age and gender as they appear in IMAGE 1.",
        '',
        'BODY SHAPE — FROM IMAGE 2:',
        "- Base the runner's body on the person's REAL body from IMAGE 2: same height, proportions, shoulder width, chest, hips, arms and legs. It must still clearly look like THEIR body.",
        '- Flatter them a LITTLE, like a proud finisher in good shape: make the waist and belly very slightly slimmer (about half an inch / 1–2 cm narrower) with a slightly more toned, upright, confident posture.',
        '- Keep it subtle and natural: do NOT change their body type, do NOT make a fuller person look thin, and do NOT add big muscles. Friends should still recognise their figure.',
        '- If the person is ALREADY slim or thin, do NOT make them any thinner — keep their body exactly as it is.',
        '- Use IMAGE 2 ONLY for body shape. IGNORE its clothes, pose, background and lighting — dress the runner in the outfit described below, in the poster pose.',
        '- The face still comes from IMAGE 1 (sharper and closer).',
      ].join('\n'),
    );
}

type Box = { x: number; y: number; w: number; h: number };

/**
 * Find the empty white box the AI left for the logos (top-right area of the poster).
 * The AI doesn't always put it in exactly the same place, so we look for the largest
 * pure-white rectangle there instead of trusting a fixed position.
 * Returns poster pixel coordinates (1200x1800), or null if no convincing box is found.
 */
async function findLogoBox(poster: Buffer): Promise<Box | null> {
  const SW = 150, SH = 225; // work on a small copy: 8x smaller than the poster
  const { data } = await sharp(poster).resize(SW, SH, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  // Search area: right ~60% of the width, top ~35% of the height
  const rx0 = Math.round(SW * 0.38), ry1 = Math.round(SH * 0.35);
  const cols = SW - rx0;
  const heights = new Array(cols).fill(0);
  let best: Box | null = null;

  for (let y = 0; y < ry1; y++) {
    for (let c = 0; c < cols; c++) {
      const i = (y * SW + rx0 + c) * 3;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const white = r > 236 && g > 236 && b > 236 && Math.max(r, g, b) - Math.min(r, g, b) < 14;
      heights[c] = white ? heights[c] + 1 : 0;
    }
    // Largest rectangle in this row's histogram
    const stack: number[] = [];
    for (let c = 0; c <= cols; c++) {
      const hgt = c === cols ? 0 : heights[c];
      while (stack.length && heights[stack[stack.length - 1]] >= hgt) {
        const top = stack.pop()!;
        const h = heights[top];
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        const w = c - left;
        if (h > 0 && (!best || w * h > best.w * best.h)) best = { x: rx0 + left, y: y - h + 1, w, h };
      }
      stack.push(c);
    }
  }

  if (!best) return null;
  const aspect = best.w / best.h;
  // Must be a reasonably sized, landscape-shaped box (rejects thin strips and big white backgrounds)
  if (best.w < SW * 0.18 || best.h < SH * 0.035 || aspect < 1.4 || aspect > 7 || best.w > SW * 0.7) return null;

  // A real box stands out from its surroundings. Check a ring just outside it: if that ring is
  // mostly white too, we've found plain white background (e.g. a standee photo), not a box.
  const isWhite = (x: number, y: number) => {
    const i = (y * SW + x) * 3;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return r > 236 && g > 236 && b > 236 && Math.max(r, g, b) - Math.min(r, g, b) < 14;
  };
  let ring = 0, ringWhite = 0;
  const M = 2;
  for (let x = best.x - M; x < best.x + best.w + M; x++) {
    for (const y of [best.y - M, best.y + best.h - 1 + M]) {
      if (x >= 0 && x < SW && y >= 0 && y < SH) { ring++; if (isWhite(x, y)) ringWhite++; }
    }
  }
  for (let y = best.y; y < best.y + best.h; y++) {
    for (const x of [best.x - M, best.x + best.w - 1 + M]) {
      if (x >= 0 && x < SW && y >= 0 && y < SH) { ring++; if (isWhite(x, y)) ringWhite++; }
    }
  }
  if (ring === 0 || ringWhite / ring > 0.35) return null;

  const k = POSTER_W / SW;
  return { x: best.x * k, y: best.y * k, w: best.w * k, h: best.h * k };
}

/** Normalise the AI output to 1200x1800 and stamp the real Yi | JKKN logos in the top-right card. */
export async function stampMarathonLogos(aiImageBase64: string, origin: string): Promise<string> {
  const [yiBuf, jkknBuf, runnersBuf] = await Promise.all([
    readPublicAsset(YI_LOGO_PATH, origin),
    readPublicAsset(JKKN_LOGO_PATH, origin),
    readPublicAsset(ERODE_RUNNERS_LOGO_PATH, origin),
  ]);

  const poster = await sharp(Buffer.from(aiImageBase64, 'base64'))
    .resize(POSTER_W, POSTER_H, { fit: 'cover', position: 'centre' })
    .toBuffer();

  // The empty white box the AI left: detected, or the template's position as a fallback
  const found = await findLogoBox(poster);
  const bumpX = found?.x ?? POSTER_W * CARD.x0;
  const bumpY = found?.y ?? POSTER_H * CARD.y0;
  const bumpW = found?.w ?? POSTER_W * (CARD.x1 - CARD.x0);
  const bumpH = found?.h ?? POSTER_H * (CARD.y1 - CARD.y0);
  const bumpCx = bumpX + bumpW / 2;
  const bumpCy = bumpY + bumpH / 2;

  // 1) Soft-edged white patch: wipes any stray marks the AI drew in the box, without touching the bump outline
  // Inset so the AI box's own rounded edge stays visible
  const cleanW = Math.round(bumpW * (found ? 0.94 : CLEAN_SCALE));
  const cleanH = Math.round(bumpH * (found ? 0.86 : CLEAN_SCALE));
  const FEATHER = 8;
  const cleanSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cleanW + FEATHER * 4}" height="${cleanH + FEATHER * 4}">
      <defs><filter id="f"><feGaussianBlur stdDeviation="${FEATHER / 2}"/></filter></defs>
      <rect x="${FEATHER * 2}" y="${FEATHER * 2}" width="${cleanW}" height="${cleanH}" rx="${Math.round(cleanH * 0.2)}"
        fill="#ffffff" filter="url(#f)"/>
    </svg>`,
  );

  // 2) Smaller logo card, centred in the bump, with a light border + soft shadow so it looks printed on
  // Detected box: the AI's own white box is the card — logos go straight in it.
  // Fallback: draw our own smaller card centred in the template's panel.
  const cardW = Math.round(bumpW * (found ? 0.94 : LOGO_CARD_SCALE));
  const cardH = Math.round(bumpH * (found ? 0.9 : LOGO_CARD_SCALE));
  const cardX = Math.round(bumpCx - cardW / 2);
  const cardY = Math.round(bumpCy - cardH / 2);
  const radius = Math.round(cardH * 0.24);

  const SHADOW = 10;
  const cardSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW + SHADOW * 2}" height="${cardH + SHADOW * 2}">
      <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.10"/></filter></defs>
      <rect x="${SHADOW}" y="${SHADOW}" width="${cardW}" height="${cardH}" rx="${radius}" ry="${radius}"
        fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#s)"/>
    </svg>`,
  );

  // Logo layout inside the card, all in one line:  [ Yi ] | [ JKKN ] | [ Erode Runners ]
  // Each logo's slot width is proportional to its shape, so all logos end up the same height.
  const logoBufs = [yiBuf, jkknBuf, runnersBuf];
  const n = logoBufs.length;
  const padX = Math.round(cardH * 0.10);
  const padY = Math.round(cardH * 0.14);
  const innerH = cardH - padY * 2;
  const innerW = cardW - padX * 2;
  const gap = Math.round(cardW * 0.025);
  const dividerW = 2;
  const availW = innerW - (n - 1) * (gap * 2 + dividerW);
  const centerY = cardY + cardH / 2;

  const srcMetas = await Promise.all(logoBufs.map(b => sharp(b).metadata()));
  const aspects = srcMetas.map(m => (m.width || 1) / (m.height || 1));
  const sumAspect = aspects.reduce((a, b) => a + b, 0);
  // One shared logo height: as tall as the card allows, or less if the row would be too wide
  const logoH = Math.floor(Math.min(innerH, availW / sumAspect));
  const slotWs = aspects.map(a => Math.floor(a * logoH));
  // Centre the whole row inside the card
  const rowW = slotWs.reduce((a, b) => a + b, 0) + (n - 1) * (gap * 2 + dividerW);
  const rowX = cardX + Math.round((cardW - rowW) / 2);

  const logos = await Promise.all(
    logoBufs.map((b, i) => sharp(b).resize(slotWs[i], logoH, { fit: 'inside' }).png().toBuffer()),
  );
  const metas = await Promise.all(logos.map(l => sharp(l).metadata()));

  const divider = await sharp({
    create: { width: dividerW, height: Math.round(logoH * 0.8), channels: 4, background: '#cbd5e1' },
  }).png().toBuffer();

  const logoLayers: sharp.OverlayOptions[] = [];
  let slotX = rowX;
  for (let i = 0; i < n; i++) {
    logoLayers.push({
      input: logos[i],
      left: Math.round(slotX + slotWs[i] / 2 - metas[i].width! / 2),
      top: Math.round(centerY - metas[i].height! / 2),
    });
    slotX += slotWs[i];
    if (i < n - 1) {
      logoLayers.push({ input: divider, left: slotX + gap, top: Math.round(centerY - (logoH * 0.8) / 2) });
      slotX += gap * 2 + dividerW;
    }
  }

  const out = await sharp(poster)
    .composite([
      { input: cleanSvg, left: Math.round(bumpCx - cleanW / 2) - FEATHER * 2, top: Math.round(bumpCy - cleanH / 2) - FEATHER * 2 },
      ...(found ? [] : [{ input: cardSvg, left: cardX - SHADOW, top: cardY - SHADOW }]),
      ...logoLayers,
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return `data:image/jpeg;base64,${out.toString('base64')}`;
}
