import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { ExportModal } from '../../components/ui/export-modal';
import { useExport } from '../../hooks/useExport';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download,
  DollarSign,
  Clock
} from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AccountData {
  balance: number;
  formatted_balance: string;
  total_balance: number;
  formatted_total_balance: string;
  scheduled_withdrawals: number;
  formatted_scheduled_withdrawals: string;
}

interface Transaction {
  id: number;
  type: 'DEPOSITO' | 'SAQUE';
  amount: string;
  formatted_amount: string;
  status: 'PENDENTE' | 'PROCESSADO' | 'FALHOU' | 'CANCELADO';
  created_at: string;
  scheduled_at?: string;
  processed_at?: string;
  failure_reason?: string;
  withdrawal_details?: {
    pix_type: string;
    pix_key: string;
  };
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
  next_page: number | null;
  prev_page: number | null;
}

const StatementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { exportToExcel } = useExport();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<Transaction | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/client/account/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAccountData(data.data);
      }
    } catch (error) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (error instanceof Error && error.message !== 'Unauthorized') {
        toast.error('Erro ao buscar saldo da conta');
      }
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiClient.get(`/client/transactions/statement?page=${currentPage}&per_page=10&type=${filters.type}&status=${filters.status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (error instanceof Error && error.message !== 'Unauthorized') {
        toast.error('Erro ao buscar extrato');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.type, filters.status]);

  useEffect(() => {
    fetchTransactions();
    fetchBalance();
  }, [fetchTransactions, fetchBalance]);


  const getPixTypeLabel = (pixType: string) => {
    const labels: { [key: string]: string } = {
      'EMAIL': 'E-mail',
      'PHONE': 'Telefone',
      'CPF': 'CPF',
      'RANDOM': 'Chave Aleatória'
    };
    return labels[pixType] || pixType;
  };

  const getIconColor = (transaction: Transaction) => {
    if (transaction.status === 'PROCESSADO') {
      return transaction.type === 'DEPOSITO' ? 'text-green-600' : 'text-red-600';
    } else if (transaction.status === 'PENDENTE') {
      return 'text-yellow-600';
    } else if (transaction.status === 'CANCELADO') {
      return 'text-gray-600';
    } else if (transaction.status === 'FALHOU') {
      return 'text-red-600';
    }
    return transaction.type === 'DEPOSITO' ? 'text-green-600' : 'text-red-600';
  };

  const getIconBgColor = (transaction: Transaction) => {
    if (transaction.status === 'PROCESSADO') {
      return transaction.type === 'DEPOSITO' ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200';
    } else if (transaction.status === 'PENDENTE') {
      return 'bg-yellow-50 ring-yellow-200';
    } else if (transaction.status === 'CANCELADO') {
      return 'bg-gray-50 ring-gray-200';
    } else if (transaction.status === 'FALHOU') {
      return 'bg-red-50 ring-red-200';
    }
    return transaction.type === 'DEPOSITO' ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset para primeira página ao mudar filtros
  };

  const handleCancelWithdrawal = (transaction: Transaction) => {
    setTransactionToCancel(transaction);
    setShowCancelModal(true);
  };

  const confirmCancelWithdrawal = async () => {
    if (!transactionToCancel) return;

    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/client/transactions/cancel-scheduled', {
        transaction_id: transactionToCancel.id,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Saque agendado cancelado com sucesso!');
        // Recarregar transações e saldo
        fetchTransactions();
        fetchBalance();
        setShowCancelModal(false);
        setTransactionToCancel(null);
      } else {
        toast.error(data.message || 'Erro ao cancelar saque agendado');
      }
    } catch (error) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (error instanceof Error && error.message !== 'Unauthorized') {
        toast.error('Erro ao cancelar saque agendado');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setTransactionToCancel(null);
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(filters);
      setShowExportModal(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar extrato');
    } finally {
      setIsExporting(false);
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSADO':
        return <Badge variant="default">Processado</Badge>;
      case 'PENDENTE':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'FALHOU':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'DEPOSITO' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando extrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <div className="flex h-full">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        
        <div className="flex-1 flex flex-col h-full">
          <Navbar onToggleSidebar={toggleSidebar} />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <History className="h-8 w-8 text-blue-600" />
                  Extrato de Transações
                </h1>
                <p className="text-muted-foreground">
                  Histórico completo de suas movimentações financeiras
                </p>
              </div>

              {/* Saldo e Saques Agendados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saldo Atual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Saldo Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {balanceLoading ? (
                        <div className="animate-pulse">
                          <div className="h-9 w-32 bg-muted rounded"></div>
                        </div>
                      ) : (
                        accountData?.formatted_balance || 'R$ 0,00'
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Disponível para saque
                    </p>
                  </CardContent>
                </Card>

                {/* Saques Agendados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Saques Agendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {accountData?.formatted_scheduled_withdrawals || 'R$ 0,00'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pendentes de processamento
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Transação</label>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value: string) => handleFilterChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="DEPOSITO">Depósitos</SelectItem>
                          <SelectItem value="SAQUE">Saques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value: string) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="PROCESSADO">Processado</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="FALHOU">Falhou</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters({ type: 'all', status: 'all' })}
                        className="w-full"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Transações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Transações ({transactions.length})</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportClick}
                      disabled={isExporting || transactions.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? 'Exportando...' : 'Exportar'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="group relative overflow-hidden rounded-xl border bg-card/50 p-5 transition-all hover:bg-card/80 hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-1 ${getIconBgColor(transaction)}`}>
                                {transaction.type === 'DEPOSITO' ? (
                                  <TrendingUp className={`h-5 w-5 ${getIconColor(transaction)}`} />
                                ) : (
                                  <TrendingDown className={`h-5 w-5 ${getIconColor(transaction)}`} />
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <p className="text-lg font-semibold text-foreground">
                                    {transaction.type === 'DEPOSITO' ? 'Depósito' : 'Saque'}
                                  </p>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(transaction.created_at)}
                                </p>
                                {transaction.scheduled_at && transaction.status !== 'CANCELADO' && (
                                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    <Calendar className="h-3 w-3" />
                                    <span>Agendado para: {formatDate(transaction.scheduled_at)}</span>
                                  </div>
                                )}
                                {transaction.withdrawal_details && (
                                  <div className="bg-muted/50 px-3 py-2 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                      PIX {getPixTypeLabel(transaction.withdrawal_details.pix_type)}: {transaction.withdrawal_details.pix_key}
                                    </p>
                                  </div>
                                )}
                                {transaction.failure_reason && (
                                  <div className="bg-destructive/10 px-3 py-2 rounded-lg">
                                    <p className="text-xs text-destructive font-medium">
                                      Motivo: {transaction.failure_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-3">
                              <p className={`text-xl font-bold ${
                                transaction.type === 'DEPOSITO' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'DEPOSITO' ? '+' : '-'}{transaction.formatted_amount}
                              </p>
                              {transaction.type === 'SAQUE' && 
                               transaction.status === 'PENDENTE' && 
                               transaction.scheduled_at && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelWithdrawal(transaction)}
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                                >
                                  Cancelar Agendamento
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                      <p className="text-sm">Ajuste os filtros ou realize uma transação</p>
                    </div>
                  )}
                </CardContent>
                
                {/* Paginação */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="px-6 pb-4">
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.total_pages}
                      onPageChange={handlePageChange}
                      hasNextPage={pagination.has_next_page}
                      hasPrevPage={pagination.has_prev_page}
                      total={pagination.total}
                      perPage={pagination.per_page}
                    />
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de confirmação para cancelar saque agendado */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={closeCancelModal}
        onConfirm={confirmCancelWithdrawal}
        title="Cancelar Saque Agendado"
        description={`Tem certeza que deseja cancelar o saque agendado de ${transactionToCancel?.formatted_amount}? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Cancelar"
        cancelText="Não, Manter"
        variant="destructive"
        isLoading={isCancelling}
      />

      {/* Modal de exportação */}
      <ExportModal
        isOpen={showExportModal}
        onClose={closeExportModal}
        onExport={handleExport}
        isLoading={isExporting}
      />
    </div>
  );
};

export default StatementPage;
