'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface VerificationChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  iconId: number;
  expiresAt: string;
  onVerify: () => Promise<void>;
}

export function VerificationChallengeModal({
  isOpen,
  onClose,
  iconId,
  expiresAt,
  onVerify
}: VerificationChallengeModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  // Timer para actualizar el tiempo restante
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onClose();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, expiresAt, onClose]);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await onVerify();
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificar Cuenta de Riot</DialogTitle>
          <DialogDescription>
            Cambia tu ícono de invocador al siguiente (es un ícono gratuito que todos tienen disponible)
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-32 h-32 border-2 border-blue-500 rounded-lg overflow-hidden">
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${iconId}.png`}
              alt={`Ícono ${iconId}`}
              fill
              className="object-cover"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Tiempo restante: <Clock className="inline w-4 h-4 mb-1" /> {formatTime(timeLeft)}
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || timeLeft <= 0}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
