import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertAccountSchema } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQuery } from '@tanstack/react-query';
import { ModalMode } from '@/hooks/use-modal';

// Account schema for form validation
const formSchema = insertAccountSchema.extend({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  type: z.string().min(1, 'Il tipo è obbligatorio'),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  accountId?: number;
}

const AccountModal = ({ isOpen, onClose, mode, accountId }: AccountModalProps) => {
  const { toast } = useToast();

  // Fetch account details if editing
  const { data: account } = useQuery({
    queryKey: [`/api/accounts/${accountId}`],
    enabled: mode === 'edit' && !!accountId,
  });

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
    },
    values: mode === 'edit' && account ? {
      name: account.name,
      type: account.type,
    } : undefined,
  });

  // Create or update account mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === 'create') {
        await apiRequest('POST', '/api/accounts', values);
      } else {
        await apiRequest('PUT', `/api/accounts/${accountId}`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: mode === 'create' ? 'Conto creato' : 'Conto aggiornato',
        description: mode === 'create' ? 'Il conto è stato creato con successo.' : 'Il conto è stato aggiornato con successo.',
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

  const accountTypes = [
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Carta di credito', label: 'Carta di credito' },
    { value: 'Conto corrente bancario', label: 'Conto corrente bancario' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuovo Conto' : 'Modifica Conto'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del conto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

export default AccountModal;
