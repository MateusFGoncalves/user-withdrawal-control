import React from 'react';
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
    window.location.href = redirectTo;
    return null;
  }

  if (!allowedUserTypes.includes(user.user_type)) {
    window.location.href = redirectTo;
    return null;
  }

  return <>{children}</>;
};
