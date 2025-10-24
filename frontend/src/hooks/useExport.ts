import { useCallback } from 'react';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  scheduled_at?: string;
  processed_at?: string;
  withdrawal_details?: {
    pix_type: string;
    pix_key: string;
  };
  failure_reason?: string;
}

export const useExport = () => {
  const exportToExcel = useCallback(async (filters: { type: string; status: string }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Construir URL com parâmetros de filtro
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);

      const url = `http://localhost:8080/api/client/transactions/export-excel${params.toString() ? '?' + params.toString() : ''}`;

      // Usar XMLHttpRequest para melhor controle
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.responseType = 'blob';

      xhr.onload = function() {
        if (xhr.status === 200) {
          const blob = xhr.response;
          
          
          // Verificar se é um arquivo válido (não vazio e com tamanho razoável)
          if (blob.size > 0) {
            // Criar URL para download
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Criar elemento de download
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = `extrato_transacoes_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
            
            // Adicionar ao DOM, clicar e remover
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Limpar URL
            window.URL.revokeObjectURL(blobUrl);
            
            toast.success('Arquivo Excel exportado com sucesso!');
          } else {
            toast.error('Arquivo não é um Excel válido');
          }
        } else if (xhr.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
          window.location.href = '/login';
        } else {
          toast.error('Erro ao exportar arquivo Excel');
        }
      };

      xhr.onerror = function() {
        toast.error('Erro de conexão ao exportar arquivo');
      };

      xhr.send();
      
    } catch (error) {
      toast.error('Erro ao exportar arquivo Excel');
    }
  }, []);

  return {
    exportToExcel,
  };
};
