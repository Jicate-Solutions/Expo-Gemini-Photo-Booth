import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function uploadToSupabase(base64Data: string, mimeType: string): Promise<string | null> {
  try {
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/transformations/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': mimeType,
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('Upload failed:', uploadRes.status, err);
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/transformations/${fileName}`;
  } catch (e) {
    console.error('Upload exception:', e);
    return null;
  }
}

async function saveToDb(userInfo: Record<string, string>, themeTitle: string, themeType: string, careerStyle: string, publicUrl: string, originalPhoto: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_transformations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name: userInfo.name,
        organization: userInfo.organization,
        email: userInfo.email,
        mobile_number: userInfo.mobile,
        selected_theme: themeTitle,
        theme_type: themeType,
        career_style: themeType === 'career' ? careerStyle : null,
        transformed_photo_url: publicUrl,
        original_photo_url: originalPhoto.substring(0, 100),
      }),
    });
    if (!res.ok) console.error('DB insert failed:', await res.text());
  } catch (e) {
    console.error('DB insert exception:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageData, themePrompt, themeTitle, themeType, careerStyle, isEdit, referenceImages, userInfo } = await req.json();

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

        const publicUrl = await uploadToSupabase(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');

        // Always save user data — regardless of whether image upload succeeded
        if (userInfo) {
          await saveToDb(userInfo, themeTitle || themeType, themeType, careerStyle, publicUrl || '', imageData);

          const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
          if (webhookUrl) {
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: userInfo.name, organization: userInfo.organization,
                email: userInfo.email, mobile: userInfo.mobile,
                theme: themeTitle || themeType, themeType,
                careerStyle: themeType === 'career' ? careerStyle : null,
                imageUrl: publicUrl || '', timestamp: new Date().toISOString(),
              }),
            }).catch(() => {});
          }
        }

        return NextResponse.json({ transformedImage, publicUrl: publicUrl || undefined });
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
