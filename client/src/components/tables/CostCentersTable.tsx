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
import { Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { CostCenter } from '@shared/schema';
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

interface CostCentersTableProps {
  costCenters: CostCenter[];
  onEdit: (costCenter: CostCenter) => void;
  isLoading: boolean;
}

const CostCentersTable: React.FC<CostCentersTableProps> = ({ costCenters, onEdit, isLoading }) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/cost-centers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: 'Centro di costo eliminato',
        description: 'Il centro di costo è stato eliminato con successo.',
      });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'eliminazione del centro di costo.',
      });
    },
  });

  const handleDelete = (id: number) => {
    setCostCenterToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costCenterToDelete) {
      deleteMutation.mutate(costCenterToDelete);
    }
  };

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria / Sottocategoria</TableHead>
              <TableHead></TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Caricamento centri di costo...
                </TableCell>
              </TableRow>
            ) : costCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nessun centro di costo trovato. Crea il tuo primo centro di costo.
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                // Group cost centers by category
                const groupedCostCenters: { [key: string]: CostCenter[] } = {};
                costCenters.forEach(costCenter => {
                  if (!groupedCostCenters[costCenter.category]) {
                    groupedCostCenters[costCenter.category] = [];
                  }
                  groupedCostCenters[costCenter.category].push(costCenter);
                });
                
                // Render grouped cost centers
                return Object.entries(groupedCostCenters).map(([category, centers]) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-gray-100">
                      <TableCell colSpan={3} className="font-bold text-gray-700">
                        {category}
                      </TableCell>
                    </TableRow>
                    {centers.map((costCenter) => (
                      <TableRow key={costCenter.id} className="hover:bg-gray-50">
                        <TableCell className="pl-8"></TableCell>
                        <TableCell>{costCenter.subcategory}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => onEdit(costCenter)}
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDelete(costCenter.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ));
              })()
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo centro di costo?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il centro di costo sarà eliminato definitivamente dal sistema.
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

export default CostCentersTable;
