'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Imagen de fondo principal */}
      <Image
        src="/img_hero.webp"
        alt="Arena Background"
        fill
        className="object-cover object-center"
        priority
        quality={100}
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-black/80" />
      
      {/* Spotlight effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent animate-pulse" 
           style={{ 
             backgroundSize: '100% 100%',
             backgroundPosition: 'center',
             mixBlendMode: 'overlay'
           }}
      />

      {/* Efecto de partículas/luces */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: Math.random()
            }}
            animate={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>



      {/* Líneas de grid */}
      <div 
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)'
        }}
      />
    </div>
  );
};
