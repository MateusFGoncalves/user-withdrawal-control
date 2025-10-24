import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'CLIENTE' | 'MASTER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isClient: boolean;
  isMaster: boolean;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verificar se o token ainda é válido no backend
          const response = await apiClient.get('/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          const data = await response.json();
          if (data.success) {
            setToken(storedToken);
            setUser(data.data.user);
          } else {
            // Token inválido, limpar storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Se for erro 401, o apiClient já fez o logout e redirecionamento
          if (error instanceof Error && error.message !== 'Unauthorized') {
            toast.error('Erro ao validar sessão');
          }
          // Em caso de erro, limpar storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } else {
        // Não há token armazenado, garantir que o estado está limpo
        setToken(null);
        setUser(null);
      }
      
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isClient = user?.user_type === 'CLIENTE';
  const isMaster = user?.user_type === 'MASTER';

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    isClient,
    isMaster,
  };
};
