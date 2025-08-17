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

    // Verificar cada 2 minutos
    const interval = setInterval(checkStreamStatus, 120000);

    return () => clearInterval(interval);
  }, []);

  if (!isLive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => window.open(`https://www.twitch.tv/${TWITCH_CHANNEL}`, '_blank')}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <div className="relative">
          <Twitch className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">¡EN VIVO!</span>
          <span className="text-xs opacity-80">{streamTitle || gameName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-purple-700 px-2 py-0.5 rounded-full text-sm">
            {viewerCount} viewers
          </span>
        </div>
      </Button>
    </div>
  );
}