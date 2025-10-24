import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { InputGroup, InputGroupPrefix, InputGroupInput } from '../../components/ui/input-group';
import toast from 'react-hot-toast';
import { ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, parseCurrency } from '../../helpers/currency';

interface AccountData {
  balance: number;
  formatted_balance: string;
  total_balance: number;
  formatted_total_balance: string;
  scheduled_withdrawals: number;
  formatted_scheduled_withdrawals: string;
}

const DepositPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

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


  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const depositAmount = amount
    const depositAmountFloat = parseFloat(depositAmount);

    if (isNaN(depositAmountFloat) || depositAmountFloat <= 0) {
      toast.error('Por favor, insira um valor válido maior que zero');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/client/transactions/deposit', {
        amount: depositAmount,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Depósito de ${data.data.transaction.formatted_amount} realizado com sucesso!`);
        setAmount('');
        // Recarregar saldo após depósito bem-sucedido
        fetchBalance();
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/client/dashboard');
        }, 2000);
      } else {
        toast.error(data.message || 'Erro ao realizar depósito. Tente novamente.');
      }
    } catch (err) {
      // Se for erro 401, o apiClient já fez o logout e redirecionamento
      if (err instanceof Error && err.message !== 'Unauthorized') {
        toast.error('Erro de conexão. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="h-screen bg-background">
      <div className="flex h-full">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        
        <div className="flex-1 flex flex-col h-full">
          <Navbar onToggleSidebar={toggleSidebar} />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="w-full space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <ArrowUpRight className="h-8 w-8 text-green-600" />
                  Realizar Depósito
                </h1>
                <p className="text-muted-foreground">
                  Adicione dinheiro à sua conta digital
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

              {/* Layout em Grade */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card de Depósito - Ocupa 2 colunas */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Depósito
                      </CardTitle>
                      <CardDescription>
                        Digite o valor que deseja depositar em sua conta
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Valor do Depósito</Label>
                          <InputGroup>
                            <InputGroupPrefix>
                              R$
                            </InputGroupPrefix>
                            <InputGroupInput
                              id="amount"
                              type="text"
                              placeholder="0,00"
                              className="text-lg"
                              required
                              value={amount ? formatCurrency((parseFloat(amount) || 0) * 100) : ''}
                                onChange={(e) => {
                                    const numericValue = Number(parseCurrency(e.target.value)) / 100;
                                 
                                    setAmount(numericValue.toString());
                                }}
                            />
                          </InputGroup>
                          <p className="text-sm text-muted-foreground">
                            O valor será creditado imediatamente em sua conta
                          </p>
                        </div>


                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={isLoading || !amount}
                            className="flex-1"
                          >
                            {isLoading ? 'Processando...' : 'Confirmar Depósito'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Informações Adicionais - Ocupa 1 coluna */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Importantes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">
                          O depósito é processado instantaneamente
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">
                          O valor fica disponível imediatamente para saque
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">
                          Todas as transações são registradas no seu extrato
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
