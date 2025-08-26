'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KickStatus() {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(false);

  const KICK_CHANNEL = 'theflako';

  useEffect(() => {
    async function checkStreamStatus() {
      try {
        const response = await fetch(`/api/kick/status?channel=${KICK_CHANNEL}`);
        const data = await response.json();

        if (response.ok) {
          setIsLive(data.is_live);
          setViewerCount(data.viewer_count || 0);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error checking stream status:', err);
        setError(true);
      }
    }

    // Verificar estado inicial
    checkStreamStatus();

    // Verificar cada 60 segundos
    const interval = setInterval(checkStreamStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      className={`fixed bottom-4 right-4 transition-all z-50 ${
        isLive 
          ? 'bg-black/50 border-[#20FF86] text-[#20FF86] hover:bg-[#20FF86] hover:text-black' 
          : 'bg-black/50 border-slate-500 text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
      onClick={() => window.open(`https://kick.com/${KICK_CHANNEL}`, '_blank')}
    >
      <Shield className={`w-5 h-5 mr-2 ${isLive ? 'animate-pulse' : ''}`} />
      <span className="font-semibold">
        {isLive ? `${viewerCount} viewers` : 'Offline'}
      </span>
    </Button>
  );
}
