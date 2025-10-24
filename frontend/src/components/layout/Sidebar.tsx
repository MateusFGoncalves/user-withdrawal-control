import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  Home, 
  Settings, 
  User, 
  LogOut,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, isClient, isMaster, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const clientMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/client/dashboard' },
    { icon: ArrowUpRight, label: 'Depósito', href: '/client/deposit' },
    { icon: ArrowDownLeft, label: 'Saque', href: '/client/withdraw' },
    { icon: History, label: 'Extrato', href: '/client/statement' },
  ];

  const masterMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/master/dashboard' },
    { icon: Users, label: 'Clientes', href: '/master/clients' },
    { icon: BarChart3, label: 'Transações', href: '/master/transactions' },
  ];

  const menuItems = isClient ? clientMenuItems : isMaster ? masterMenuItems : [];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {isOpen ? (
            <h2 className="text-xl font-semibold text-foreground">
              User Control
            </h2>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">UC</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="flex-shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant={location.pathname === item.href ? "default" : "ghost"}
            className={`w-full justify-start ${
              isOpen ? 'px-3' : 'px-1'
            }`}
            onClick={() => handleNavigation(item.href)}
          >
            <item.icon className="h-5 w-5" />
            {isOpen && <span className="ml-2">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Footer with Logout - Fixed at bottom */}
      <div className="p-4 flex-shrink-0 mt-auto">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            isOpen ? 'px-3' : 'px-1'
          }`}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  );
};
