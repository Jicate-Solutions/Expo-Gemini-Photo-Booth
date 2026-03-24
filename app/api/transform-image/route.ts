import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });


export async function POST(req: NextRequest) {
  try {
    const { imageData, themePrompt, themeTitle, themeType, careerStyle, isEdit, referenceImages } = await req.json();

    if (!imageData || !themePrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build the prompt
    let finalPrompt = themePrompt;
    if (themeType === 'career' && careerStyle === 'photorealistic') {
      finalPrompt += ' Render as a hyper-realistic professional portrait with photographic quality.';
    } else if (themeType === 'career' && careerStyle === 'artistic') {
      finalPrompt += ' Render as a stylised artistic illustration with creative flair.';
    }

    if (isEdit) {
      finalPrompt = `Edit the image as follows: ${themePrompt}. Keep the person's identity intact.`;
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts }],
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
    }

    for (const part of responseParts) {
      if (part.inlineData) {
        const transformedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return NextResponse.json({ transformedImage });
      }
    }

    return NextResponse.json({ error: 'No image generated' }, { status: 500 });

  } catch (error: unknown) {
    console.error('Transform error:', error);
    const err = error as { status?: number; message?: string };
    if (err?.status === 429) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again in a moment.' }, { status: 429 });
    }
    return NextResponse.json({ error: err.message || 'Failed to transform image' }, { status: 500 });
  }
}
