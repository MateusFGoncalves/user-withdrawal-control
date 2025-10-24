import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Client/Dashboard';
import MasterDashboard from './pages/Master/Dashboard';
import DepositPage from './pages/Client/DepositPage';
import WithdrawPage from './pages/Client/WithdrawPage';
import StatementPage from './pages/Client/StatementPage';
import ClientsPage from './pages/Master/ClientsPage';
import ClientDetailPage from './pages/Master/ClientDetailPage';
import ClientEditPage from './pages/Master/ClientEditPage';
import ClientCreatePage from './pages/Master/ClientCreatePage';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="user-withdrawal-theme">
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                minWidth: '400px',
                maxWidth: '500px',
                width: 'auto',
              },
            }}
          />
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas para clientes */}
            <Route 
              path="/client/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/deposit" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <DepositPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/withdraw" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <WithdrawPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/statement" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <StatementPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas protegidas para administradores */}
            <Route 
              path="/master/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['MASTER']}>
                  <MasterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master/clients" 
              element={
                <ProtectedRoute allowedUserTypes={['MASTER']}>
                  <ClientsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master/clients/create" 
              element={
                <ProtectedRoute allowedUserTypes={['MASTER']}>
                  <ClientCreatePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master/clients/:id" 
              element={
                <ProtectedRoute allowedUserTypes={['MASTER']}>
                  <ClientDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master/clients/:id/edit" 
              element={
                <ProtectedRoute allowedUserTypes={['MASTER']}>
                  <ClientEditPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirecionamento padrão */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
