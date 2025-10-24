import { getApiUrl } from './api';

// Função para fazer logout (sem redirecionamento automático)
const handleUnauthorized = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // O redirecionamento será feito pelo useAuth hook
};

// Interceptor para capturar erros 401
export const apiClient = {
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Se receber 401, fazer logout e redirecionar
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }

    return response;
  },

  async get(url: string, options: RequestInit = {}) {
    return this.request(url, { ...options, method: 'GET' });
  },

  async post(url: string, data?: any, options: RequestInit = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put(url: string, data?: any, options: RequestInit = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete(url: string, options: RequestInit = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  },
};
