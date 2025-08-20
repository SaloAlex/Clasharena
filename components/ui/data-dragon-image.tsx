'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getValidImageUrl } from '@/lib/data-dragon';

interface DataDragonImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  type?: 'champion' | 'spell' | 'item' | 'rune' | 'profileicon';
  identifier?: string | number;
}

export function DataDragonImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc,
  type,
  identifier
}: DataDragonImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = async () => {
    if (hasError) {
      // Si ya intentamos una vez, usar fallback
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Fallback por defecto según el tipo
        const defaultFallback = type === 'spell' 
          ? 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png'
          : 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png';
        setImageSrc(defaultFallback);
      }
      return;
    }

    setHasError(true);

    // Intentar obtener una URL válida si tenemos tipo e identificador
    if (type && identifier) {
      try {
        const validUrl = await getValidImageUrl(src, type, identifier);
        setImageSrc(validUrl);
        setIsLoading(false);
      } catch (error) {
        // Usar fallback
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        } else {
          const defaultFallback = type === 'spell' 
            ? 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png'
            : 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png';
          setImageSrc(defaultFallback);
        }
      }
    } else {
      // Si no tenemos tipo/identificador, usar fallback directo
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        const defaultFallback = 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png';
        setImageSrc(defaultFallback);
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-slate-700 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized // Evitar optimización de Next.js para URLs externas
      />
    </div>
  );
}
