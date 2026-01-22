'use client';

import { useState } from 'react';
import { 
  Home,
  Users,
  FileText,
  Settings,
  TrendingUp,
  CreditCard,
  DollarSign,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Accueil', href: '/finance', active: true },
    { icon: TrendingUp, label: 'Tableau de bord', href: '/finance/dashboard' },
    { icon: DollarSign, label: 'Revenus', href: '/finance/revenus' },
    { icon: CreditCard, label: 'Dépenses', href: '/finance/depenses' },
    { icon: FileText, label: 'Rapports', href: '/finance/rapports' },
    { icon: Users, label: 'Utilisateurs', href: '/finance/utilisateurs' },
    { icon: Settings, label: 'Paramètres', href: '/finance/parametres' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Finance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  // Navigation logic would go here
                  console.log(`Navigate to ${item.href}`);
                }}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                AM
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Alexandre Martin</p>
                <p className="text-xs text-gray-500">Responsable Financier</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
