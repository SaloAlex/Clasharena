import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { KickStatus } from '@/components/KickStatus';

import SupabaseProvider from '@/components/providers/SupabaseProvider';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClashArena - Comunidad TheFLAKOO',
  description: 'La arena definitiva para torneos de League of Legends de la comunidad de TheFLAKOO',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SupabaseProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster position="bottom-right" />
          <KickStatus />

        </SupabaseProvider>
      </body>
    </html>
  );
}