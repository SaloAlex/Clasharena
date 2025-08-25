import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface UseClearCookiesReturn {
  clearCookies: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useClearCookies(): UseClearCookiesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearCookies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
          description: 'La página se recargará automáticamente',
        });
        
        // Recargar la página después de limpiar las cookies
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || 'Error al limpiar cookies');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado al limpiar cookies';
      setError(errorMessage);
      toast.error(errorMessage, {
        icon: <AlertCircle className="w-4 h-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    clearCookies,
    isLoading,
    error,
  };
}
