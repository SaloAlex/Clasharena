'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Plus, Calculator } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const adjustmentSchema = z.object({
  points: z.number()
    .int("Los puntos deben ser un número entero")
    .min(-1000, "Máximo -1000 puntos")
    .max(1000, "Máximo 1000 puntos"),
  reason: z.string()
    .min(10, "La razón debe tener al menos 10 caracteres")
    .max(500, "La razón no puede exceder 500 caracteres"),
  evidenceUrl: z.string()
    .url("La URL debe ser válida")
    .optional()
    .or(z.literal('')),
  matchId: z.string()
    .optional()
    .or(z.literal('')),
  matchDate: z.string()
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal(''))
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface TournamentPointAdjustmentProps {
  tournamentId: string;
  userId: string;
  userName: string;
  onAdjustmentComplete?: () => void;
}

export function TournamentPointAdjustment({
  tournamentId,
  userId,
  userName,
  onAdjustmentComplete
}: TournamentPointAdjustmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      points: 0,
      reason: '',
      evidenceUrl: '',
      matchId: '',
      matchDate: '',
      notes: ''
    }
  });

  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/tournaments/${tournamentId}/adjust-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al ajustar puntos');
      }

      toast.success('Puntos ajustados correctamente');
      setIsOpen(false);
      form.reset();
      onAdjustmentComplete?.();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calculator className="w-4 h-4" />
          Ajustar Puntos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Puntos</DialogTitle>
          <DialogDescription>
            Ajuste manual de puntos para {userName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puntos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ej: 10 o -5"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Usa números negativos para restar puntos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explica por qué se hace este ajuste"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidenceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Evidencia</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="URL de la captura de pantalla"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de Partida</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ID de la partida de Riot"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de la Partida</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales (solo visibles para admins)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Guardar Ajuste'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}