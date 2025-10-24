import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Clock
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../hooks/useAuth';
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
  withdrawal_details?: {
    pix_type: string;
    pix_key: string;
  };
}


const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [scheduledWithdrawals, setScheduledWithdrawals] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountData();
    fetchRecentTransactions();
  }, []);

  const fetchAccountData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/account/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setAccountData(data.data);
        // Usar os dados de saques agendados do backend
        setScheduledWithdrawals(data.data.scheduled_withdrawals || 0);
      }
    } catch (error) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (error instanceof Error && error.message !== 'Unauthorized') {
        toast.error('Erro ao buscar dados da conta');
      }
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/transactions/recent?limit=4&days=30', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRecentTransactions(data.data.transactions);
      }
    } catch (error) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (error instanceof Error && error.message !== 'Unauthorized') {
        toast.error('Erro ao buscar transações');
      }
    } finally {
      setLoading(false);
    }
  };


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


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
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
                <h1 className="text-3xl font-bold text-foreground">
                  Bem-vindo, {user?.name}!
                </h1>
                <p className="text-muted-foreground">
                  Gerencie sua conta digital e suas transações
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
                      {accountData?.formatted_balance || 'R$ 0,00'}
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

              {/* Ações Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/deposit')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      Depósito
                    </CardTitle>
                    <CardDescription>
                      Adicionar dinheiro à sua conta
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/withdraw')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowDownLeft className="h-5 w-5 text-orange-600" />
                      Saque
                    </CardTitle>
                    <CardDescription>
                      Sacar dinheiro via PIX
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/statement')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      Extrato
                    </CardTitle>
                    <CardDescription>
                      Ver histórico de transações
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Transações Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Transações Recentes (30 dias)
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/statement')}
                    >
                      Ver todas
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="group relative overflow-hidden rounded-xl border bg-card/50 p-4 transition-all hover:bg-card/80 hover:shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1 ${getIconBgColor(transaction)}`}>
                                {transaction.type === 'DEPOSITO' ? (
                                  <TrendingUp className={`h-5 w-5 ${getIconColor(transaction)}`} />
                                ) : (
                                  <TrendingDown className={`h-5 w-5 ${getIconColor(transaction)}`} />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">
                                    {transaction.type === 'DEPOSITO' ? 'Depósito' : 'Saque'}
                                  </p>
                                  <Badge variant={
                                    transaction.status === 'PROCESSADO' ? 'default' :
                                    transaction.status === 'PENDENTE' ? 'secondary' : 
                                    transaction.status === 'CANCELADO' ? 'destructive' : 'destructive'
                                  } className="text-xs">
                                    {transaction.status === 'PROCESSADO' ? 'Processado' :
                                     transaction.status === 'PENDENTE' ? 'Pendente' :
                                     transaction.status === 'CANCELADO' ? 'Cancelado' : 'Falhou'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {transaction.type === 'SAQUE' && transaction.withdrawal_details && (
                                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">
                                    PIX {getPixTypeLabel(transaction.withdrawal_details.pix_type)}: {transaction.withdrawal_details.pix_key}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                transaction.type === 'DEPOSITO' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'DEPOSITO' ? '+' : '-'}{transaction.formatted_amount}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
