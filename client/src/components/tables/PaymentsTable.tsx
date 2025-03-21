import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileText, FilePlus, Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { PaymentWithRelations } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
  onEdit: (payment: PaymentWithRelations) => void;
  isLoading: boolean;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, onEdit, isLoading }) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: 'Pagamento eliminato',
        description: 'Il pagamento è stato eliminato con successo.',
      });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'eliminazione del pagamento.',
      });
    },
  });

  const handleDelete = (id: number) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete);
    }
  };

  // Filter payments by search term
  const filteredPayments = payments.filter(
    (payment) => 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${payment.costCenter.category} - ${payment.costCenter.subcategory}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('it-IT');
  };

  // Handle file viewing
  const viewFile = (path: string | null) => {
    if (!path) return;
    window.open(`/api/uploads/${path}`, '_blank');
  };

  // Sort payments according to requirements and apply pagination
  const sortAndPaginate = () => {
    // Create a copy to sort
    const sorted = [...filteredPayments].sort((a, b) => {
      // First by category (ascending)
      const categoryComp = a.costCenter.category.localeCompare(b.costCenter.category);
      if (categoryComp !== 0) return categoryComp;
      
      // Then by subcategory (ascending)
      const subcategoryComp = a.costCenter.subcategory.localeCompare(b.costCenter.subcategory);
      if (subcategoryComp !== 0) return subcategoryComp;
      
      // Then by date (descending - most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Apply pagination
    return {
      paginatedData: sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage),
      totalPages: Math.ceil(sorted.length / itemsPerPage)
    };
  };
  
  const { paginatedData, totalPages } = sortAndPaginate();

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10 pr-3 py-2"
          placeholder="Cerca pagamenti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro di Costo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Sottocategoria</TableHead>
              <TableHead className="w-[100px]">Data pagamento</TableHead>
              <TableHead>Importo</TableHead>
              <TableHead>Conto</TableHead>
              <TableHead>Allegati</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Caricamento pagamenti...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Nessun pagamento trovato.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell className="whitespace-nowrap">
                    {payment.description}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {payment.costCenter.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {payment.costCenter.subcategory}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(payment.date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {payment.account.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex space-x-2">
                      {payment.receiptPath && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-blue-600 hover:text-blue-800" 
                          title="Visualizza ricevuta"
                          onClick={() => viewFile(payment.receiptPath)}
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      )}
                      {payment.requestPath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-800"
                          title="Visualizza richiesta"
                          onClick={() => viewFile(payment.requestPath)}
                        >
                          <FilePlus className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => onEdit(payment)}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il pagamento sarà eliminato definitivamente dal sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaymentsTable;
