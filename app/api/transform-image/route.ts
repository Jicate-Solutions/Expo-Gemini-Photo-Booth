import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

    // Extract base64 data from data URL
    const base64Image = imageData.split(',')[1];
    const mimeType = (imageData.split(';')[0].split(':')[1] as string) || 'image/jpeg';

    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
      { text: finalPrompt },
      { inlineData: { mimeType, data: base64Image } },
    ];

    // Add reference images if provided
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
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;

    if (!responseParts) {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
    }

    for (const part of responseParts) {
      if (part.inlineData) {
        const transformedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

        // Upload to Supabase Storage using service role key
        try {
          const supabase = createClient();
          const base64Data = part.inlineData.data;
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const ext = (part.inlineData.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transformations')
            .upload(fileName, imageBuffer, { contentType: part.inlineData.mimeType || 'image/jpeg', upsert: false });

          if (uploadError) {
            console.error('Storage upload error:', uploadError.message, uploadError);
            return NextResponse.json({ transformedImage, uploadError: uploadError.message });
          }

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from('transformations').getPublicUrl(uploadData.path);
            const publicUrl = urlData.publicUrl;

            // Save to DB
            if (userInfo) {
              await supabase.from('user_transformations').insert({
                name: userInfo.name,
                organization: userInfo.organization,
                email: userInfo.email,
                mobile_number: userInfo.mobile,
                selected_theme: themeTitle || themeType,
                theme_type: themeType,
                career_style: themeType === 'career' ? careerStyle : null,
                transformed_photo_url: publicUrl,
                original_photo_url: (imageData as string).substring(0, 100),
              });

              // Save to Google Sheets
              const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
              if (webhookUrl) {
                await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: userInfo.name,
                    organization: userInfo.organization,
                    email: userInfo.email,
                    mobile: userInfo.mobile,
                    theme: themeTitle || themeType,
                    themeType,
                    careerStyle: themeType === 'career' ? careerStyle : null,
                    imageUrl: publicUrl,
                    timestamp: new Date().toISOString(),
                  }),
                }).catch(() => {});
              }
            }

            return NextResponse.json({ transformedImage, publicUrl });
          }
        } catch (storageErr: unknown) {
          const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
          console.error('Storage exception:', msg);
          return NextResponse.json({ transformedImage, uploadError: msg });
        }

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
