import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertCostCenterSchema } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQuery } from '@tanstack/react-query';
import { ModalMode } from '@/hooks/use-modal';

// Cost center schema for form validation
const formSchema = insertCostCenterSchema.extend({
  category: z.string().min(1, 'La categoria è obbligatoria'),
  subcategory: z.string().min(1, 'La sottocategoria è obbligatoria'),
});

type FormValues = z.infer<typeof formSchema>;

interface CostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  costCenterId?: number;
}

const CostCenterModal = ({ isOpen, onClose, mode, costCenterId }: CostCenterModalProps) => {
  const { toast } = useToast();

  // Fetch cost center details if editing
  const { data: costCenter } = useQuery({
    queryKey: [`/api/cost-centers/${costCenterId}`],
    enabled: mode === 'edit' && !!costCenterId,
  });

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: '',
      subcategory: '',
    },
    values: mode === 'edit' && costCenter ? {
      category: costCenter.category,
      subcategory: costCenter.subcategory,
    } : undefined,
  });

  // Create or update cost center mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === 'create') {
        await apiRequest('POST', '/api/cost-centers', values);
      } else {
        await apiRequest('PUT', `/api/cost-centers/${costCenterId}`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: mode === 'create' ? 'Centro di costo creato' : 'Centro di costo aggiornato',
        description: mode === 'create' ? 'Il centro di costo è stato creato con successo.' : 'Il centro di costo è stato aggiornato con successo.',
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Si è verificato un errore. Riprova più tardi.',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuovo Centro di Costo' : 'Modifica Centro di Costo'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Categoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sottocategoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Sottocategoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mr-2"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Salvataggio...' : mode === 'create' ? 'Crea' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CostCenterModal;
