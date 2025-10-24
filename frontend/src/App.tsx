import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/Client/ClientDashboard';
import DepositPage from './pages/Client/DepositPage';
import WithdrawPage from './pages/Client/WithdrawPage';
import StatementPage from './pages/Client/StatementPage';

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
              path="/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/deposit" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <DepositPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/withdraw" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <WithdrawPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/statement" 
              element={
                <ProtectedRoute allowedUserTypes={['CLIENTE']}>
                  <StatementPage />
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
