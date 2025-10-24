import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  BarChart3, 
  Search, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  formatted_amount: string;
  status: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  formatted_created_at: string;
  scheduled_at: string | null;
  formatted_scheduled_at: string | null;
  processed_at: string | null;
  formatted_processed_at: string | null;
  pix_type: string | null;
  pix_key: string | null;
  failure_reason: string | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const TransactionsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search, type, status, sortBy, sortOrder]);

  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        navigate('/login', { replace: true });
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search,
        type: type === 'all' ? '' : type,
        status: status === 'all' ? '' : status,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(getApiUrl(`/master/transactions/list?${params}`), {
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
        throw new Error('Erro ao carregar transações');
      }

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.message || 'Erro ao carregar transações');
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
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
    fetchTransactions(page);
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('all');
    setStatus('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSADO':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDENTE':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FALHOU':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'CANCELADO':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FALHOU':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSITO':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'SAQUE':
        return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSITO':
        return 'bg-green-50 ring-green-200';
      case 'SAQUE':
        return 'bg-red-50 ring-red-200';
      default:
        return 'bg-gray-50 ring-gray-200';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando transações...</p>
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
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  Transações
                </h1>
                <p className="text-muted-foreground">
                  Visualize e gerencie todas as transações do sistema
                </p>
              </div>

              {/* Filtros e Busca */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por cliente..."
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
                      <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="DEPOSITO">Depósito</SelectItem>
                          <SelectItem value="SAQUE">Saque</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="PROCESSADO">Processado</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="FALHOU">Falhou</SelectItem>
                          <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Valor
                        {sortBy === 'amount' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Button>
                      {(search || type !== 'all' || status !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc') && (
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

              {/* Lista de Transações */}
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-1 ${getTypeColor(transaction.type)}`}>
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {transaction.formatted_amount}
                                </h3>
                                <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                                  {getStatusIcon(transaction.status)}
                                  <span className="ml-1">{transaction.status}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {transaction.user.name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {transaction.formatted_created_at}
                                </div>
                                {transaction.type === 'SAQUE' && transaction.pix_type && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {transaction.pix_type}: {transaction.pix_key}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {transaction.scheduled_at && (
                                <div className="text-xs text-muted-foreground">
                                  Agendado para: {transaction.formatted_scheduled_at}
                                </div>
                              )}
                              {transaction.failure_reason && (
                                <div className="text-xs text-red-600">
                                  Erro: {transaction.failure_reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/master/clients/${transaction.user.id}`)}
                              className="flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              Ver Cliente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Nenhuma transação encontrada
                      </h3>
                      <p className="text-muted-foreground">
                        Não há transações que correspondam aos filtros aplicados.
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
                        Mostrando {pagination.from} a {pagination.to} de {pagination.total} transações
                      </div>
                      
                      <div className="flex items-center gap-2">
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

                        <div className="flex items-center gap-1">
                          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => {
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

export default TransactionsPage;
