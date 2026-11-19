/**
 * OpenAI image generation for the booth (server-only).
 * Uses the /v1/images/edits endpoint: the visitor's photo (+ any reference images, e.g. the
 * marathon template) go in as image[] parts, in order, so "IMAGE 1 / IMAGE 2" in the prompt line up.
 *
 * Env:
 *   OPENAI_API_KEY        required
 *   OPENAI_IMAGE_MODEL    optional, default gpt-image-2.6-sunburst
 *   OPENAI_IMAGE_QUALITY  optional, low | medium | high (default high — the poster is printed 4x6)
 */

const OPENAI_URL = 'https://api.openai.com/v1/images/edits';
export const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2.6-sunburst';

export class ImageGenError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [head, b64] = dataUrl.split(',');
  const mime = head.split(';')[0].split(':')[1] || 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return { blob: new Blob([Buffer.from(b64, 'base64')], { type: mime }), ext };
}

/**
 * Generate one portrait 2:3 image (1024x1536) from the prompt + input images.
 * Returns base64 PNG data (no data: prefix). Throws ImageGenError with an HTTP-like status.
 */
export async function generateWithOpenAI(prompt: string, images: string[]): Promise<{ base64: string; mimeType: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ImageGenError('OPENAI_API_KEY is not set', 500, 'missing_key');

  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_OPENAI_IMAGE_MODEL;
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'high';

  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', '1024x1536'); // 2:3 portrait = 4x6 print
  form.append('quality', quality);
  form.append('n', '1');
  images.forEach((img, i) => {
    const { blob, ext } = dataUrlToBlob(img);
    form.append('image[]', blob, `image-${i + 1}.${ext}`);
  });

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error ?? {};
    const code: string | undefined = err.code || err.type;
    const msg: string = err.message || `OpenAI error ${res.status}`;
    // OpenAI reports "out of credits" as 429 insufficient_quota — treat it as billing (402), not a rate limit
    if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') {
      throw new ImageGenError(msg, 402, code);
    }
    throw new ImageGenError(msg, res.status, code);
  }

  const b64: string | undefined = json?.data?.[0]?.b64_json;
  if (!b64) throw new ImageGenError('No image generated', 500, 'no_image');
  return { base64: b64, mimeType: 'image/png' };
}
