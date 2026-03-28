import type { Metadata, Viewport } from 'next';
import ToastProvider from '@/components/ToastProvider';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import UpdatePrompt from '@/components/pwa/UpdatePrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gemini Magic Booth — AI Photo Transformation',
  description:
    'Transform your photo with AI. 110+ themes — superhero, career, fantasy and more. By Jicate Solutions.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Magic Booth',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#030712',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
      </head>
      <body className="antialiased">
        {children}
        <ToastProvider />
        <InstallPrompt />
        <UpdatePrompt />
      </body>
    </html>
  );
}
