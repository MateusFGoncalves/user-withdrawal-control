// Função para obter a URL base da API baseada na origem atual
export const getApiBaseUrl = (): string => {
  const currentOrigin = window.location.origin;
  
  // Se estamos na porta 3000 (frontend direto), usar localhost:8080 para API (nginx)
  if (currentOrigin.includes(':3000')) {
    return 'http://localhost:8080';
  }
  
  // Caso contrário, usar a origem atual
  return currentOrigin;
};

// Função para construir URLs da API
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api${endpoint}`;
};
