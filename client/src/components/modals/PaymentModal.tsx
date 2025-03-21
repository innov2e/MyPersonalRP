import { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertPaymentSchema } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ModalMode } from '@/hooks/use-modal';

// Extend the payment schema for the form
const formSchema = insertPaymentSchema.extend({
  date: z.string().min(1, 'Date is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)),
    { message: 'Amount must be a valid number' }
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  paymentId?: number;
}

const PaymentModal = ({ isOpen, onClose, mode, paymentId }: PaymentModalProps) => {
  const { toast } = useToast();
  const receiptFileRef = useRef<HTMLInputElement>(null);
  const requestFileRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [requestFile, setRequestFile] = useState<File | null>(null);

  // Fetch payment details if editing
  const { data: payment, isLoading: isLoadingPayment } = useQuery({
    queryKey: [`/api/payments/${paymentId}`],
    enabled: mode === 'edit' && !!paymentId,
  });

  // Fetch accounts and cost centers for select options
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: costCenters = [] } = useQuery<any[]>({
    queryKey: ['/api/cost-centers'],
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: '',
      amount: '',
      description: '',
      accountId: undefined,
      costCenterId: undefined,
    },
    values: mode === 'edit' && payment ? {
      date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : '',
      amount: payment.amount?.toString() || '',
      description: payment.description || '',
      accountId: payment.accountId,
      costCenterId: payment.costCenterId,
    } : undefined,
  });

  // Create or update payment mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      
      // Convert amount to number and format data
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        date: new Date(values.date).toISOString(),
        accountId: Number(values.accountId),
        costCenterId: Number(values.costCenterId),
      };
      
      formData.append('data', JSON.stringify(payload));
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }
      
      if (requestFile) {
        formData.append('request', requestFile);
      }
      
      if (mode === 'create') {
        await fetch('/api/payments', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      } else if (mode === 'edit' && paymentId) {
        await fetch(`/api/payments/${paymentId}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: mode === 'create' ? 'Pagamento creato' : 'Pagamento aggiornato',
        description: mode === 'create' ? 'Il pagamento è stato creato con successo.' : 'Il pagamento è stato aggiornato con successo.',
      });
      onClose();
      setReceiptFile(null);
      setRequestFile(null);
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

  // File input handlers
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRequestFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuovo Pagamento' : 'Modifica Pagamento'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Inserisci una descrizione"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conto</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un conto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.length ? accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id ? account.id.toString() : "0"}>
                          {account.name}
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-accounts">Nessun conto disponibile</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="costCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro di Costo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un centro di costo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {costCenters?.length ? costCenters.map((costCenter) => (
                        <SelectItem key={costCenter.id} value={costCenter.id ? costCenter.id.toString() : "0"}>
                          {costCenter.category} - {costCenter.subcategory}
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-cost-centers">Nessun centro di costo disponibile</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label htmlFor="receipt">Allegato Ricevuta</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="receipt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>{receiptFile ? receiptFile.name : 'Carica un file'}</span>
                      <input
                        id="receipt-upload"
                        ref={receiptFileRef}
                        name="receipt"
                        type="file"
                        className="sr-only"
                        onChange={handleReceiptChange}
                      />
                    </label>
                    {!receiptFile && <p className="pl-1">o trascina e rilascia</p>}
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF fino a 10MB</p>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="request">Allegato Richiesta</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="request-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>{requestFile ? requestFile.name : 'Carica un file'}</span>
                      <input
                        id="request-upload"
                        ref={requestFileRef}
                        name="request"
                        type="file"
                        className="sr-only"
                        onChange={handleRequestChange}
                      />
                    </label>
                    {!requestFile && <p className="pl-1">o trascina e rilascia</p>}
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF fino a 10MB</p>
                </div>
              </div>
            </div>

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

export default PaymentModal;
