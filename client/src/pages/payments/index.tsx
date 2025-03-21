import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import PaymentsTable from '@/components/tables/PaymentsTable';
import PaymentModal from '@/components/modals/PaymentModal';
import { useModal } from '@/hooks/use-modal';
import { PaymentWithRelations } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PaymentsPage = () => {
  const { isOpen, mode, data, onOpen, onClose } = useModal<PaymentWithRelations>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('');

  // Fetch payments
  const {
    data: payments = [],
    isLoading: isLoadingPayments,
    refetch,
  } = useQuery({
    queryKey: ['/api/payments'],
  });

  // Fetch cost centers for filter dropdown
  const { data: costCenters = [] } = useQuery({
    queryKey: ['/api/cost-centers'],
  });

  const handleEdit = (payment: PaymentWithRelations) => {
    onOpen('edit', payment);
  };

  const handleCreate = () => {
    onOpen('create');
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCostCenterFilter('');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Gestione Pagamenti</h1>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <Plus className="h-5 w-5 mr-1" />
          Nuovo Pagamento
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data da:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data a:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="costCenter" className="block text-sm font-medium text-gray-700 mb-1">
              Centro di Costo:
            </Label>
            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger id="costCenter">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {costCenters.map((costCenter) => (
                  <SelectItem 
                    key={costCenter.id} 
                    value={costCenter.id.toString()}
                  >
                    {costCenter.category} - {costCenter.subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={handleResetFilters}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Applica Filtri
          </Button>
        </div>
      </Card>

      {/* Payments Table */}
      <PaymentsTable
        payments={payments.filter((payment: PaymentWithRelations) => {
          // Apply date filters
          let match = true;
          if (startDate) {
            const paymentDate = new Date(payment.date);
            const filterDate = new Date(startDate);
            match = match && paymentDate >= filterDate;
          }
          if (endDate) {
            const paymentDate = new Date(payment.date);
            const filterDate = new Date(endDate);
            // Set time to end of day for inclusive filtering
            filterDate.setHours(23, 59, 59, 999);
            match = match && paymentDate <= filterDate;
          }
          // Apply cost center filter
          if (costCenterFilter && costCenterFilter !== 'all') {
            match = match && payment.costCenterId.toString() === costCenterFilter;
          }
          return match;
        })}
        onEdit={handleEdit}
        isLoading={isLoadingPayments}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isOpen}
        onClose={onClose}
        mode={mode}
        paymentId={data?.id}
      />
    </div>
  );
};

export default PaymentsPage;
