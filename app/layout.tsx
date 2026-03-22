import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gemini Magic Booth — AI Photo Transformation',
  description: 'Transform your photo with AI. 110+ themes — superhero, career, fantasy and more. By Jicate Solutions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
