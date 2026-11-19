import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildMarathonPosterPrompt, getMarathonTemplateDataUrl, sanitizeGender, stampMarathonLogos } from '@/lib/marathonPoster';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });


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

    const base64Image = imageData.split(',')[1];
    const mimeType = (imageData.split(';')[0].split(':')[1] as string) || 'image/jpeg';

    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
      { text: finalPrompt },
      { inlineData: { mimeType, data: base64Image } },
    ];

    if (referenceImages && referenceImages.length > 0) {
      for (const refImg of referenceImages) {
        const refBase64 = (refImg as string).split(',')[1];
        const refMime = ((refImg as string).split(';')[0].split(':')[1]) || 'image/jpeg';
        parts.push({ inlineData: { mimeType: refMime, data: refBase64 } });
      }
    }

    const MAX_ATTEMPTS = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['IMAGE', 'TEXT'],
            // Lock the poster to 2:3 so the logo card lands in the same place every time
            ...(isMarathonPoster ? { imageConfig: { aspectRatio: '2:3' } } : {}),
          },
        });

        const responseParts = response.candidates?.[0]?.content?.parts;
        if (!responseParts) {
          return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
        }

        for (const part of responseParts) {
          if (part.inlineData?.data) {
            const transformedImage = isMarathonPoster
              ? await stampMarathonLogos(part.inlineData.data, origin)
              : `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            return NextResponse.json({ transformedImage });
          }
        }

        return NextResponse.json({ error: 'No image generated' }, { status: 500 });

      } catch (err: unknown) {
        lastError = err;
        const e = err as { status?: number; code?: number; message?: string };
        const is503 = e?.status === 503 || e?.code === 503 ||
          (e?.message || '').toLowerCase().includes('deadline') ||
          (e?.message || '').toLowerCase().includes('unavailable');

        // Don't retry rate limits — only retry timeouts/503s
        if (!is503 || attempt === MAX_ATTEMPTS) break;

        console.warn(`Gemini timeout (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`);
        await new Promise(r => setTimeout(r, 1500 * attempt)); // 1.5s, 3s
      }
    }

    const e = lastError as { status?: number; message?: string };
    console.error('Transform error after retries:', lastError);
    if (e?.status === 429) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again in a moment.' }, { status: 429 });
    }
    if (e?.status === 402) {
      // Billing problem (e.g. Gemini prepaid credits used up) — retrying won't help, so say so
      return NextResponse.json({ error: 'AI service credits are used up. Please contact the booth admin.' }, { status: 402 });
    }
    return NextResponse.json({ error: 'Generation timed out. Please try again.' }, { status: 500 });

  } catch (error: unknown) {
    console.error('Unexpected transform error:', error);
    return NextResponse.json({ error: 'Failed to transform image' }, { status: 500 });
  }
}
