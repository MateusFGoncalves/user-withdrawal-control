import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  UserPlus,
  X
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

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const ClientsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchClients();
  }, [search, sortBy, sortOrder]);

  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '3',
        search: search,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(getApiUrl(`/master/clients/list?${params}`), {
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
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();
      
      if (data.success) {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.message || 'Erro ao buscar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page: number) => {
    fetchClients(page);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSortBy('created_at');
    setSortOrder('desc');
    // Os filtros serão aplicados automaticamente pelo useEffect
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
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
                    Gerenciar Clientes
                  </h1>
                  <p className="text-muted-foreground">
                    Visualize e gerencie todos os clientes do sistema
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate('/master/clients/create')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Cadastrar Cliente
                  </Button>
                </div>
              </div>

              {/* Filtros e Busca */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                      {search && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearch('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Nome
                        {sortBy === 'name' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Data
                        {sortBy === 'created_at' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Button>
                      {(search || sortBy !== 'created_at' || sortOrder !== 'desc') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Clientes */}
              <div className="space-y-4">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {client.name}
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {client.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cadastrado em {client.formatted_created_at}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/master/clients/${client.id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/master/clients/${client.id}/edit`)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                          </div>
                        </div>
                        
                        {/* Estatísticas do Cliente */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {client.account.formatted_balance}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Saldo Atual
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {client.stats.formatted_total_deposits}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Total Depósitos
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {client.stats.formatted_total_withdrawals}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Activity className="h-3 w-3" />
                              Total Saques
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {client.stats.formatted_scheduled_withdrawals}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              Saques Agendados
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                      <p className="text-muted-foreground">
                        {search ? 'Tente ajustar os filtros de busca.' : 'Ainda não há clientes cadastrados.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Paginação */}
              {pagination && pagination.last_page > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {pagination.from} a {pagination.to} de {pagination.total} clientes
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Botão Anterior */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>

                        {/* Números das páginas */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => {
                            // Mostrar apenas algumas páginas ao redor da atual
                            const showPage = 
                              pageNum === 1 || 
                              pageNum === pagination.last_page || 
                              (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1);
                            
                            if (!showPage) {
                              if (pageNum === pagination.current_page - 2 || pageNum === pagination.current_page + 2) {
                                return <span key={pageNum} className="text-muted-foreground">...</span>;
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === pagination.current_page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        {/* Botão Próxima */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.last_page}
                          className="flex items-center gap-1"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
