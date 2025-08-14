import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { TwitchStatus } from '@/components/TwitchStatus';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClashArenaGG - Comunidad TheFLAKOO',
  description: 'La arena definitiva para torneos de League of Legends de la comunidad de TheFLAKOO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster position="bottom-right" />
        <TwitchStatus />
      </body>
    </html>
  );
}