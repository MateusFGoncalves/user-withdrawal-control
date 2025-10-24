import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('CLIENTE' | 'MASTER')[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserTypes = ['CLIENTE', 'MASTER'],
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  if (!allowedUserTypes.includes(user.user_type)) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  return <>{children}</>;
};
