// components/layout/Navbar.tsx
'use client';

import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import {
  Menu,
  Search,
  Bell,
  User,
  Sun,
  Moon,
  
} from 'lucide-react';
import { useTheme } from 'next-themes';
// import GlobalNavbarFilter from './global-navbar-filter';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Partie gauche */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Filtre global professionnel */}
          {/* <div className="hidden lg:flex items-center gap-2">
            <GlobalNavbarFilter />
          </div> */}
        </div>

        {/* Partie droite */}
        <div className="flex items-center gap-2">
          {/* Bouton recherche mobile */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Bouton thème */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Profil */}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Profil</span>
          </Button>
        </div>
      </div>
    </header>
  );
}