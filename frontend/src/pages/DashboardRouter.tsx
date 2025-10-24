import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardRouter: React.FC = () => {
  const { user, isClient, isMaster } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar baseado no tipo de usuário
    if (isClient) {
      navigate('/client/dashboard', { replace: true });
    } else if (isMaster) {
      navigate('/master/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
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

export default DashboardRouter;