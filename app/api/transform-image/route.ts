import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildMarathonPosterPrompt, getMarathonTemplateDataUrl, sanitizeGender, stampMarathonLogos } from '@/lib/marathonPoster';
import { generateWithOpenAI, ImageGenError } from '@/lib/openaiImage';

// High-quality image generation can take 30–60s+
export const maxDuration = 120;

/**
 * Which AI draws the images. Set AI_IMAGE_PROVIDER=gemini to switch back to Google.
 * Default: OpenAI (management's choice).
 */
function getProvider(): 'openai' | 'gemini' {
  return (process.env.AI_IMAGE_PROVIDER || 'openai').toLowerCase() === 'gemini' ? 'gemini' : 'openai';
}

let geminiClient: GoogleGenAI | null = null;
async function generateWithGemini(
  prompt: string,
  images: string[],
  aspectRatio?: string,
): Promise<{ base64: string; mimeType: string }> {
  if (!process.env.GEMINI_API_KEY) throw new ImageGenError('GEMINI_API_KEY is not set', 500, 'missing_key');
  geminiClient ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: prompt }];
  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: (img.split(';')[0].split(':')[1] as string) || 'image/jpeg',
        data: img.split(',')[1],
      },
    });
  }

  try {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
      },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new ImageGenError('No image generated', 500, 'no_image');
    return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
  } catch (err) {
    if (err instanceof ImageGenError) throw err;
    const e = err as { status?: number; code?: number; message?: string };
    const msg = e?.message || 'Gemini error';
    const lower = msg.toLowerCase();
    const status = e?.status ?? e?.code ??
      (lower.includes('deadline') || lower.includes('unavailable') ? 503 : 500);
    throw new ImageGenError(msg, Number(status) || 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageData, themePrompt, themeType, careerStyle, isEdit, marathonPoster } = body;
    let referenceImages: string[] = Array.isArray(body.referenceImages) ? body.referenceImages : [];

    // Marathon poster: the server owns the prompt and the template, so they can't drift on the client
    const isMarathonPoster = marathonPoster === true && !isEdit;
    const origin = req.nextUrl.origin;

    if (!imageData || (!themePrompt && !isMarathonPoster)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build the prompt
    let finalPrompt = isMarathonPoster
      ? buildMarathonPosterPrompt(body.userInfo?.bibNumber, sanitizeGender(body.userInfo?.gender))
      : themePrompt;
    if (themeType === 'career' && careerStyle === 'photorealistic') {
      finalPrompt += ' Render as a hyper-realistic professional portrait with photographic quality.';
    } else if (themeType === 'career' && careerStyle === 'artistic') {
      finalPrompt += ' Render as a stylised artistic illustration with creative flair.';
    }

    if (isEdit) {
      finalPrompt = `Edit the image as follows: ${themePrompt}. Keep the person's identity intact.`;
    }

    // Enforce 4x6 portrait output (2:3 aspect ratio) for print compatibility
    finalPrompt += ' IMPORTANT: Generate the output image in portrait orientation with a 2:3 aspect ratio (width:height), like a 4x6 inch photo print.';

    // Marathon poster: the template is the only reference image (it must be IMAGE 2 in the prompt)
    if (isMarathonPoster) {
      referenceImages = [await getMarathonTemplateDataUrl(origin)];
    }

    // IMAGE 1 = visitor photo, then reference images in order
    const images: string[] = [imageData, ...referenceImages.filter((r): r is string => typeof r === 'string' && r.startsWith('data:'))];

    const provider = getProvider();
    const MAX_ATTEMPTS = 3;
    let lastError: ImageGenError | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const out = provider === 'openai'
          ? await generateWithOpenAI(finalPrompt, images)
          // Lock the Gemini marathon poster to 2:3 so the logo card lands in the same place every time
          : await generateWithGemini(finalPrompt, images, isMarathonPoster ? '2:3' : undefined);

        const transformedImage = isMarathonPoster
          ? await stampMarathonLogos(out.base64, origin)
          : `data:${out.mimeType};base64,${out.base64}`;
        return NextResponse.json({ transformedImage });
      } catch (err) {
        lastError = err instanceof ImageGenError ? err : new ImageGenError(String((err as Error)?.message || err), 500);
        const s = lastError.status;
        // Only retry temporary server trouble — not billing, rate limits, or bad requests
        const retryable = s >= 500 && lastError.code !== 'missing_key' && lastError.code !== 'no_image';
        if (!retryable || attempt === MAX_ATTEMPTS) break;
        console.warn(`${provider} image error ${s} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`);
        await new Promise(r => setTimeout(r, 1500 * attempt)); // 1.5s, 3s
      }
    }

    const e = lastError;
    console.error(`Transform error after retries (${provider}):`, e?.status, e?.code, e?.message);
    if (e?.status === 402) {
      // Billing problem (credits used up) — retrying won't help, so say so
      return NextResponse.json({ error: 'AI service credits are used up. Please contact the booth admin.' }, { status: 402 });
    }
    if (e?.status === 429) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again in a moment.' }, { status: 429 });
    }
    if (e?.code === 'moderation_blocked' || (e?.message || '').toLowerCase().includes('safety')) {
      return NextResponse.json({ error: 'The AI could not use this photo. Please retake the selfie.' }, { status: 400 });
    }
    if (e?.code === 'missing_key') {
      return NextResponse.json({ error: 'AI service is not configured. Please contact the booth admin.' }, { status: 500 });
    }
    if (e?.code === 'no_image') {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Generation timed out. Please try again.' }, { status: 500 });

  } catch (error: unknown) {
    console.error('Unexpected transform error:', error);
    return NextResponse.json({ error: 'Failed to transform image' }, { status: 500 });
  }
}
