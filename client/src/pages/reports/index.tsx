import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown, BarChart2, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PaymentWithRelations } from '@shared/schema';

const ReportsPage = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');

  // Fetch data
  const { data: payments = [] } = useQuery({
    queryKey: ['/api/payments'],
  });
  
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts'],
  });
  
  const { data: costCenters = [] } = useQuery({
    queryKey: ['/api/cost-centers'],
  });

  // Apply filters
  const filteredPayments = payments.filter((payment: PaymentWithRelations) => {
    let match = true;
    if (startDate) {
      const paymentDate = new Date(payment.date);
      const filterDate = new Date(startDate);
      match = match && paymentDate >= filterDate;
    }
    if (endDate) {
      const paymentDate = new Date(payment.date);
      const filterDate = new Date(endDate);
      filterDate.setHours(23, 59, 59, 999);
      match = match && paymentDate <= filterDate;
    }
    if (categoryFilter) {
      match = match && payment.costCenter.category === categoryFilter;
    }
    if (accountFilter) {
      match = match && payment.accountId.toString() === accountFilter;
    }
    return match;
  });

  // Calculate statistics
  const totalExpenses = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  // Group by categories
  const categoriesSummary = filteredPayments.reduce((acc, payment) => {
    const category = payment.costCenter.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Number(payment.amount);
    return acc;
  }, {} as Record<string, number>);

  // Calculate category percentages
  const categoriesWithPercentage = Object.entries(categoriesSummary).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
  }));

  // Sort payments by amount
  const topExpenses = [...filteredPayments].sort((a, b) => 
    Number(b.amount) - Number(a.amount)
  ).slice(0, 5);

  // Get unique categories from cost centers
  const categories = [...new Set(costCenters.map(cc => cc.category))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Report e Analisi</h1>
        <p className="text-gray-600">Analizza i pagamenti per periodo, conto e centro di costo</p>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria:
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte le categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
              Conto:
            </Label>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Tutti i conti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti i conti</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Genera Report
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Totale Spese</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-600 flex items-center">
              <ChevronUp className="h-4 w-4 mr-1" />
              8.2%
            </span>
            <span className="text-gray-500 ml-2">rispetto al periodo precedente</span>
          </div>
        </Card>
        
        {categoriesWithPercentage.slice(0, 3).map((item, index) => (
          <Card className="p-4" key={item.category}>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Spese {item.category}</h3>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(item.amount)}</p>
            <div className="flex items-center mt-2 text-sm">
              <span className={`${index % 2 === 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {index % 2 === 0 ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {index % 2 === 0 ? '12.4%' : '3.1%'}
              </span>
              <span className="text-gray-500 ml-2">rispetto al periodo precedente</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Spese per Categoria</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center text-gray-500">
              <PieChart className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-2">Grafico a torta delle spese per categoria</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Andamento Spese nel Tempo</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center text-gray-500">
              <BarChart2 className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-2">Grafico a linee dell'andamento spese</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Expenses Table */}
      <Card className="rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Spese Principali</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrizione</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Centro di Costo</TableHead>
                <TableHead>Importo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Nessun pagamento trovato per il periodo selezionato.
                  </TableCell>
                </TableRow>
              ) : (
                topExpenses.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell>{payment.description}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {payment.costCenter.category} - {payment.costCenter.subcategory}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
