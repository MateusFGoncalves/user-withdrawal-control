import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user, isClient, isMaster } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar baseado no tipo de usuário
    if (isClient) {
      navigate('/dashboard');
    } else if (isMaster) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  }, [isClient, isMaster, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Dashboard;