'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Twitch } from 'lucide-react';

export function TwitchStatus() {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState('');
  const [gameName, setGameName] = useState('');
  const TWITCH_CHANNEL = 'theflakoo';
  const TWITCH_CLIENT_ID = 'ihnx3fyrg1ujytxpkzhtvy2jp7e35a';

  useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const response = await fetch(`/api/twitch/status?channel=${TWITCH_CHANNEL}`);
        const data = await response.json();
        
              setIsLive(data.isLive);
      setViewerCount(data.viewers || 0);
      setStreamTitle(data.title || '');
      setGameName(data.gameName || '');
      } catch (error) {
        console.error('Error checking stream status:', error);
      }
    };

    // Verificar estado inicial
    checkStreamStatus();

    // Verificar cada minuto
    const interval = setInterval(checkStreamStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => window.open(`https://www.twitch.tv/${TWITCH_CHANNEL}`, '_blank')}
        className={`${
          isLive 
            ? "bg-red-600 hover:bg-red-700" 
            : "bg-neutral-800 hover:bg-neutral-700"
        } text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
      >
        <div className="relative">
          <Twitch className="w-5 h-5" />
          {isLive && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        {isLive ? (
          <>
            <div className="flex flex-col items-start">
              <span className="font-medium">¡EN VIVO!</span>
              <span className="text-xs opacity-80">{streamTitle || gameName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-700 px-2 py-0.5 rounded-full text-sm">
                {viewerCount} viewers
              </span>
            </div>
          </>
        ) : (
          <span className="font-medium">Seguir en Twitch</span>
        )}
      </Button>
    </div>
  );
}
