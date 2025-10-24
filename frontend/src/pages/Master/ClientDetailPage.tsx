import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  ArrowLeft,
  Edit,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Calendar,
  Mail,
  User
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Client {
  id: number;
  name: string;
  email: string;
  created_at: string;
  formatted_created_at: string;
  account: {
    id: number;
    balance: number;
    formatted_balance: string;
  };
  stats: {
    total_transactions: number;
    total_deposits: number;
    formatted_total_deposits: string;
    total_withdrawals: number;
    formatted_total_withdrawals: string;
    scheduled_withdrawals: number;
    formatted_scheduled_withdrawals: string;
  };
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  formatted_amount: string;
  status: string;
  created_at: string;
  formatted_date: string;
  scheduled_at?: string;
  processed_at?: string;
  pix_type?: string;
  pix_key?: string;
  failure_reason?: string;
}

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(getApiUrl(`/master/clients/${id}`), {
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
        if (response.status === 404) {
          toast.error('Cliente não encontrado.');
          navigate('/master/clients', { replace: true });
          return;
        }
        throw new Error('Erro ao buscar detalhes do cliente');
      }

      const data = await response.json();
      
      if (data.success) {
        setClient(data.data.client);
        setRecentTransactions(data.data.recent_transactions);
      } else {
        toast.error(data.message || 'Erro ao buscar detalhes do cliente');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente:', error);
      toast.error('Erro ao buscar detalhes do cliente');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSADO':
        return <Badge variant="default" className="text-xs">Processado</Badge>;
      case 'PENDENTE':
        return <Badge variant="secondary" className="text-xs">Pendente</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive" className="text-xs">Cancelado</Badge>;
      default:
        return <Badge variant="destructive" className="text-xs">Falhou</Badge>;
    }
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (type === 'DEPOSITO') {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else {
      return <Activity className={`h-5 w-5 ${
        status === 'PROCESSADO' ? 'text-red-600' : 
        status === 'PENDENTE' ? 'text-yellow-600' : 'text-gray-600'
      }`} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando detalhes do cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Cliente não encontrado</h3>
          <p className="text-muted-foreground mb-4">
            O cliente solicitado não foi encontrado.
          </p>
          <Button onClick={() => navigate('/master/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Clientes
          </Button>
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {client.name}
                  </h1>
                  <p className="text-muted-foreground">
                    Detalhes e histórico do cliente
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/master/clients')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => navigate(`/master/clients/${client.id}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                        <p className="font-medium">{client.formatted_created_at}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Informações da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                      <p className="text-3xl font-bold text-primary">
                        {client.account.formatted_balance}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">ID da Conta</p>
                      <p className="font-mono text-sm">{client.account.id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Total Depósitos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {client.stats.formatted_total_deposits}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Depósitos processados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-red-600" />
                      Total Saques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {client.stats.formatted_total_withdrawals}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Saques processados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Saques Agendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {client.stats.formatted_scheduled_withdrawals}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pendentes de processamento
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transações Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Transações Recentes
                    </span>
                    <Badge variant="outline" className="text-sm">
                      {recentTransactions.length} transações
                    </Badge>
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
                                {getTransactionIcon(transaction.type, transaction.status)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">
                                    {transaction.type === 'DEPOSITO' ? 'Depósito' : 'Saque'}
                                  </p>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.formatted_date}
                                </p>
                                {transaction.pix_type && transaction.pix_key && (
                                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">
                                    PIX {transaction.pix_type}: {transaction.pix_key}
                                  </p>
                                )}
                                {transaction.failure_reason && (
                                  <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md inline-block">
                                    Motivo: {transaction.failure_reason}
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

export default ClientDetailPage;
