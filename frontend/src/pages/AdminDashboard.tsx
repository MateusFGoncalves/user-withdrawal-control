import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  UserCheck,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface AdminStats {
  totalClients: number;
  totalAccounts: number;
  totalTransactions: number;
  totalFunds: number;
  formattedTotalFunds: string;
}

interface RecentClient {
  id: number;
  name: string;
  email: string;
  balance: number;
  formatted_balance: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Simular dados por enquanto - implementar endpoints específicos para admin
      setStats({
        totalClients: 150,
        totalAccounts: 150,
        totalTransactions: 1250,
        totalFunds: 2500000,
        formattedTotalFunds: 'R$ 2.500.000,00'
      });

      setRecentClients([
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@exemplo.com',
          balance: 1500.00,
          formatted_balance: 'R$ 1.500,00',
          created_at: '2025-10-23T10:00:00Z'
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@exemplo.com',
          balance: 2300.50,
          formatted_balance: 'R$ 2.300,50',
          created_at: '2025-10-23T09:30:00Z'
        },
        {
          id: 3,
          name: 'Pedro Costa',
          email: 'pedro@exemplo.com',
          balance: 850.75,
          formatted_balance: 'R$ 850,75',
          created_at: '2025-10-23T08:15:00Z'
        }
      ]);
    } catch (error) {
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
                  Painel Administrativo
                </h1>
                <p className="text-muted-foreground">
                  Gerencie clientes, contas e transações do sistema
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Clientes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Contas
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Contas ativas no sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Transações
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +8% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Fundos
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {stats?.formattedTotalFunds || 'R$ 0,00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Saldo total do banco
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ações Administrativas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/clients')}>
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

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/accounts')}>
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

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/transactions')}>
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

              {/* Clientes Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Clientes Recentes
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/admin/clients')}
                    >
                      Ver todos
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentClients.length > 0 ? (
                    <div className="space-y-3">
                      {recentClients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-primary">{client.formatted_balance}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(client.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum cliente encontrado</p>
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

export default AdminDashboard;
