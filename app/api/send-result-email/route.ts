import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { to, userName, themeName, imageUrl, downloadUrl } = await req.json();

    if (!to || !userName || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Your AI Transformation</title></head>
      <body style="font-family: Arial, sans-serif; background: #0f0f23; color: #ffffff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 32px; text-align: center;">
          <h1 style="color: #a855f7; font-size: 28px; margin-bottom: 8px;">✨ Gemini Magic Booth</h1>
          <p style="color: #9ca3af; margin-bottom: 24px;">by Jicate Solutions</p>
          <p style="font-size: 18px;">Hi <strong>${userName}</strong>!</p>
          <p>Your AI transformation as <strong>${themeName}</strong> is ready.</p>
          <img src="${imageUrl}" alt="Your Transformation" style="width: 100%; border-radius: 12px; margin: 24px 0;" />
          <a href="${downloadUrl}" style="display: inline-block; background: #a855f7; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">📥 Download Your Photo</a>
          <hr style="border-color: #374151; margin: 32px 0;" />
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Jicate Solutions</strong><br/>
            "SHAPE YOUR FUTURE..! PARTNER WITH JICATE..!"<br/>
            📧 info@jicate.solutions | 📞 +91 90254 49944
          </p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Gemini Magic Booth" <${process.env.GMAIL_USER}>`,
      to,
      subject: `✨ Your AI Transformation is Ready — ${themeName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
