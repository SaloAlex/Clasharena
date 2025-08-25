'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ClearCookiesButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ClearCookiesButton({
  variant = 'outline',
  size = 'default',
  className = '',
  children = 'Limpiar Cookies',
  onSuccess,
  onError
}: ClearCookiesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClearCookies = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/clear-cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cookies limpiadas exitosamente', {
          icon: <CheckCircle className="w-4 h-4" />,
        });
        onSuccess?.();
        
        // Recargar la página después de limpiar las cookies
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || 'Error al limpiar cookies');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado al limpiar cookies';
      toast.error(errorMessage, {
        icon: <AlertCircle className="w-4 h-4" />,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClearCookies}
      disabled={isLoading}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4 mr-2" />
      )}
      {children}
    </Button>
  );
}
