import React from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  Home, 
  Settings, 
  User, 
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: User, label: 'Perfil', href: '/profile' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="p-4">
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

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`w-full justify-start ${
              isOpen ? 'px-3' : 'px-1'
            }`}
            onClick={() => {
              // Navegação será implementada com React Router
              console.log(`Navigate to ${item.href}`);
            }}
          >
            <item.icon className="h-5 w-5" />
            {isOpen && <span className="ml-2">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Footer with Logout */}
      <div className="p-4">
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
