import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { InputGroup, InputGroupPrefix, InputGroupInput } from '../components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DatePicker } from '../components/ui/date-picker';
import toast from 'react-hot-toast';
import { ArrowDownLeft, CreditCard, Clock, DollarSign } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useMoneyMask } from '../hooks/useMoneyMask';

interface AccountData {
  balance: number;
  formatted_balance: string;
  total_balance: number;
  formatted_total_balance: string;
  scheduled_withdrawals: number;
  formatted_scheduled_withdrawals: string;
}

const WithdrawPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    pixType: 'EMAIL',
    pixKey: '',
    scheduledAt: undefined as Date | undefined,
    withdrawType: 'immediate' // 'immediate' ou 'scheduled'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  const amountInputRef = useMoneyMask(formData.amount, (value) => 
    setFormData(prev => ({ ...prev, amount: value }))
  );

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/account/balance'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccountData(data.data);
        }
      }
        } catch (error) {
          toast.error('Erro ao buscar saldo da conta');
        } finally {
      setBalanceLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Remover formatação do vanilla-masker: "R$ 55,00" -> "55,00" -> "55.00" -> 55.00
    const cleanAmount = formData.amount.replace(/[^\d,]/g, ''); // Remove tudo exceto dígitos e vírgula
    const withdrawAmount = parseFloat(cleanAmount.replace(',', '.')); // Substitui vírgula por ponto
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Por favor, insira um valor válido maior que zero');
      setIsLoading(false);
      return;
    }

    if (!formData.pixKey.trim()) {
      toast.error('Por favor, insira a chave PIX');
      setIsLoading(false);
      return;
    }

    if (formData.withdrawType === 'scheduled' && !formData.scheduledAt) {
      toast.error('Por favor, selecione uma data para o saque agendado');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData: any = {
        amount: withdrawAmount,
        pix_type: formData.pixType,
        pix_key: formData.pixKey,
      };

      if (formData.withdrawType === 'scheduled' && formData.scheduledAt) {
        requestData.scheduled_at = formData.scheduledAt.toISOString().split('T')[0];
      }

      const response = await fetch(getApiUrl('/transactions/withdraw'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        const message = formData.withdrawType === 'immediate' 
          ? `Saque de ${data.data.transaction.formatted_amount} realizado com sucesso!`
          : `Saque de ${data.data.transaction.formatted_amount} agendado para ${formData.scheduledAt?.toLocaleDateString('pt-BR')}!`;
        
        toast.success(message);
        
        // Recarregar saldo após saque bem-sucedido
        fetchBalance();
        
        // Limpar formulário
        setFormData({
          amount: '',
          pixType: 'EMAIL',
          pixKey: '',
          scheduledAt: undefined,
          withdrawType: 'immediate'
        });

        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        toast.error(data.message || 'Erro ao realizar saque. Tente novamente.');
      }
    } catch (err) {
      toast.error('Erro de conexão. Tente novamente.');
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
                  <ArrowDownLeft className="h-8 w-8 text-orange-600" />
                  Realizar Saque
                </h1>
                <p className="text-muted-foreground">
                  Saque dinheiro via PIX para sua conta
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
                {/* Card de Saque - Ocupa 2 colunas */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Saque via PIX
                      </CardTitle>
                      <CardDescription>
                        Escolha entre saque imediato ou agendado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tipo de Saque */}
                        <div className="space-y-2">
                          <Label>Tipo de Saque</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={formData.withdrawType === 'immediate' ? 'default' : 'outline'}
                              onClick={() => handleInputChange('withdrawType', 'immediate')}
                              className="flex items-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Imediato
                            </Button>
                            <Button
                              type="button"
                              variant={formData.withdrawType === 'scheduled' ? 'default' : 'outline'}
                              onClick={() => handleInputChange('withdrawType', 'scheduled')}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Agendado
                            </Button>
                          </div>
                        </div>

                        {/* Valor e Tipo de PIX em linha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Valor do Saque</Label>
                            <InputGroup>
                              <InputGroupPrefix>
                                R$
                              </InputGroupPrefix>
                              <InputGroupInput
                                ref={amountInputRef}
                                id="amount"
                                type="text"
                                placeholder="0,00"
                                className="text-lg"
                                required
                              />
                            </InputGroup>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pixType">Tipo de Chave PIX</Label>
                            <Select value={formData.pixType} onValueChange={(value: string) => handleInputChange('pixType', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EMAIL">E-mail</SelectItem>
                                <SelectItem value="PHONE">Telefone</SelectItem>
                                <SelectItem value="CPF">CPF</SelectItem>
                                <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Chave PIX */}
                        <div className="space-y-2">
                          <Label htmlFor="pixKey">Chave PIX</Label>
                          <Input
                            id="pixKey"
                            type="text"
                            placeholder="Digite sua chave PIX"
                            value={formData.pixKey}
                            onChange={(e) => handleInputChange('pixKey', e.target.value)}
                            required
                          />
                        </div>

                        {/* Data de Agendamento (apenas para saque agendado) */}
                        {formData.withdrawType === 'scheduled' && (
                          <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Data do Saque</Label>
                            <div className="w-48">
                              <DatePicker
                                date={formData.scheduledAt}
                                onDateChange={(date) => setFormData(prev => ({ ...prev, scheduledAt: date }))}
                                placeholder="Selecionar data"
                                minDate={new Date()}
                                maxDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Agendamento limitado a 7 dias no futuro
                            </p>
                          </div>
                        )}


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
                            disabled={isLoading || !formData.amount || !formData.pixKey}
                            className="flex-1"
                          >
                            {isLoading ? 'Processando...' : 
                             formData.withdrawType === 'immediate' ? 'Confirmar Saque' : 'Agendar Saque'}
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
                          {formData.withdrawType === 'immediate' 
                            ? 'O saque é processado instantaneamente e o valor é debitado imediatamente'
                            : 'O saque agendado não debita o valor no momento do agendamento'
                          }
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">
                          Saques agendados são limitados a 7 dias no futuro
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">
                          Verifique se há saldo suficiente antes de confirmar
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

export default WithdrawPage;
