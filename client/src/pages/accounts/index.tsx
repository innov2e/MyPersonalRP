import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AccountsTable from '@/components/tables/AccountsTable';
import AccountModal from '@/components/modals/AccountModal';
import { useModal } from '@/hooks/use-modal';
import { Account } from '@shared/schema';

const AccountsPage = () => {
  const { isOpen, mode, data, onOpen, onClose } = useModal<Account>();

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
  } = useQuery({
    queryKey: ['/api/accounts'],
  });

  const handleEdit = (account: Account) => {
    onOpen('edit', account);
  };

  const handleCreate = () => {
    onOpen('create');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Gestione Conti</h1>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <Plus className="h-5 w-5 mr-1" />
          Nuovo Conto
        </Button>
      </div>

      {/* Accounts Table */}
      <AccountsTable
        accounts={accounts}
        onEdit={handleEdit}
        isLoading={isLoadingAccounts}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={isOpen}
        onClose={onClose}
        mode={mode}
        accountId={data?.id}
      />
    </div>
  );
};

export default AccountsPage;
