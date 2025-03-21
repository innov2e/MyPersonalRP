import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CostCentersTable from '@/components/tables/CostCentersTable';
import CostCenterModal from '@/components/modals/CostCenterModal';
import { useModal } from '@/hooks/use-modal';
import { CostCenter } from '@shared/schema';

const CostCentersPage = () => {
  const { isOpen, mode, data, onOpen, onClose } = useModal<CostCenter>();

  // Fetch cost centers
  const {
    data: costCenters = [],
    isLoading: isLoadingCostCenters,
  } = useQuery({
    queryKey: ['/api/cost-centers'],
  });

  const handleEdit = (costCenter: CostCenter) => {
    onOpen('edit', costCenter);
  };

  const handleCreate = () => {
    onOpen('create');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Gestione Centri di Costo</h1>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <Plus className="h-5 w-5 mr-1" />
          Nuovo Centro di Costo
        </Button>
      </div>

      {/* Cost Centers Table */}
      <CostCentersTable
        costCenters={costCenters}
        onEdit={handleEdit}
        isLoading={isLoadingCostCenters}
      />

      {/* Cost Center Modal */}
      <CostCenterModal
        isOpen={isOpen}
        onClose={onClose}
        mode={mode}
        costCenterId={data?.id}
      />
    </div>
  );
};

export default CostCentersPage;
