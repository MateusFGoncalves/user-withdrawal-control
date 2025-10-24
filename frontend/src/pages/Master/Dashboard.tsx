import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  CreditCard,
  BarChart3,
  Clock
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AdminStats {
  totalClients: number;
  totalTransactions: number;
  totalFunds: number;
  formattedTotalFunds: string;
  totalScheduledWithdrawals: number;
  formattedTotalScheduledWithdrawals: string;
}

interface RecentTransaction {
  id: number;
  type: string;
  amount: number;
  formatted_amount: string;
  status: string;
  user_name: string;
  user_email: string;
  created_at: string;
  formatted_date: string;
  scheduled_at?: string;
  processed_at?: string;
  pix_type?: string;
  pix_key?: string;
  failure_reason?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(getApiUrl('/master/transactions/stats'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
          navigate('/login', { replace: true });
          return;
        }
        if (response.status === 403) {
          toast.error('Acesso negado. Apenas administradores.');
          return;
        }
        throw new Error('Erro ao buscar dados administrativos');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.stats);
        setRecentTransactions(data.data.recentTransactions);
      } else {
        toast.error(data.message || 'Erro ao buscar dados administrativos');
      }
    } catch (error) {
      console.error('Erro ao buscar dados administrativos:', error);
      toast.error('Erro ao buscar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
                  Painel Administrativo
                </h1>
                <p className="text-muted-foreground">
                  Gerencie clientes, contas e transações do sistema
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Total de Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {stats?.totalClients || 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clientes cadastrados no sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Total de Fundos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {stats?.formattedTotalFunds || 'R$ 0,00'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Saldo total do banco
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Saques Agendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {stats?.formattedTotalScheduledWithdrawals || 'R$ 0,00'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pendentes de processamento
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ações Administrativas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/master/clients')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Gerenciar Clientes
                    </CardTitle>
                    <CardDescription>
                      Visualizar e gerenciar clientes
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/master/accounts')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      Gerenciar Contas
                    </CardTitle>
                    <CardDescription>
                      Visualizar e gerenciar contas
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/master/transactions')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Histórico Global
                    </CardTitle>
                    <CardDescription>
                      Ver todas as transações
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Transações Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Transações Recentes (30 dias)
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/master/transactions')}
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
                              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1 ${
                                transaction.type === 'DEPOSITO' 
                                  ? 'bg-green-50 ring-green-200' 
                                  : transaction.status === 'PROCESSADO' 
                                    ? 'bg-red-50 ring-red-200' 
                                    : transaction.status === 'PENDENTE'
                                      ? 'bg-yellow-50 ring-yellow-200'
                                      : 'bg-gray-50 ring-gray-200'
                              }`}>
                                {transaction.type === 'DEPOSITO' ? (
                                  <TrendingUp className={`h-5 w-5 ${
                                    transaction.type === 'DEPOSITO' ? 'text-green-600' : 'text-red-600'
                                  }`} />
                                ) : (
                                  <Activity className={`h-5 w-5 ${
                                    transaction.status === 'PROCESSADO' ? 'text-red-600' : 
                                    transaction.status === 'PENDENTE' ? 'text-yellow-600' : 'text-gray-600'
                                  }`} />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">
                                    {transaction.user_name}
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
                                  {transaction.user_email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.type === 'DEPOSITO' ? 'Depósito' : 'Saque'} • {transaction.formatted_date}
                                </p>
                                {transaction.pix_type && transaction.pix_key && (
                                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">
                                    PIX {transaction.pix_type}: {transaction.pix_key}
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
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
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

export default Dashboard;
