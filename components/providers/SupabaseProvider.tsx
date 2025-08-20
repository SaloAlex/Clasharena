'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('🔑 Signed in:', session?.user?.email);
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        console.log('🔒 Signed out');
        router.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return children;
}
