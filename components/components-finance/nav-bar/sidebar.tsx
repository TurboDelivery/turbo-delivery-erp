// components/layout/Sidebar.tsx
'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Home,
    ChevronLeft,
    Wallet,
    WalletCards,
    ChevronDown,
    List,
    Truck,
    ChartNoAxesCombined,
    Euro,
    Layers,
    Boxes
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const menuItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Dépenses', href: '/depense', icon: Wallet },
    {
        name: 'Revenus',
        href: '/revenue',
        icon: WalletCards,
        submenu: [
            { name: 'Cumule de revenus globaux', href: '/revenue', icon: List },
            { name: 'Cumule des frais de livraison', href: '/revenue/livraison', icon: Truck },
            { name: 'Cumule des frais de commission(%)', href: '/revenue/commission_pourcentage', icon: ChartNoAxesCombined },
            { name: 'Cumule des frais de commission(fixe)', href: '/revenue/commission_fixe', icon: Euro },
            { name: 'Cumule des investissements internes', href: '/revenue/investissement', icon: Layers },
        ]
    },
    { name: 'Recouvrements', href: '/recouvrement', icon: Boxes },
    // { name: 'Profil', href: '/profile', icon: User },
    // { name: 'Paramètres', href: '/parametre', icon: Settings },
];

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const toggleSubmenu = (menuName: string) => {
        setOpenSubmenu(openSubmenu === menuName ? null : menuName);
    };

    const isRevenueActive = pathname.startsWith('/revenue');

    return (
        <>
            {/* Overlay pour mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-card border-r",
                    isOpen ? "w-64 translate-x-0" : "-translate-x-full",
                    "lg:relative lg:translate-x-0 lg:w-64"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* En-tête de la sidebar */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex justify-center items-center gap-2">
                            <Image
                                src="/assets/images/logo_turbo.jpg"
                                alt="Logo"
                                width={80}
                                height={80}
                                className="rounded-lg h-[60px] w-[60px] md:h-[80px] md:w-[80px]"
                            />
                            <p className="text-[18px] md:text-[20px] font-bold italic">Turbo Finance</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="lg:hidden"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.name === 'Revenus' && isRevenueActive);

                            // Menu normal (sans sous-menu)
                            if (!item.submenu) {
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-red-500 text-white"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) {
                                                toggleSidebar();
                                            }
                                        }}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            }

                            // Menu avec sous-menu (Revenus)
                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={cn(
                                            "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                            isActive
                                                ? "bg-red-500 text-white"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <Icon className="mr-3 h-5 w-5" />
                                            {item.name}
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                openSubmenu === item.name && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {/* Sous-menu */}
                                    {openSubmenu === item.name && (
                                        <div className="ml-4 space-y-1 border-l pl-2">
                                            {item.submenu.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                const isSubActive = pathname === subItem.href;

                                                return (
                                                    <Link
                                                        key={subItem.name}
                                                        href={subItem.href}
                                                        className={cn(
                                                            "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                                                            isSubActive
                                                                ? "text-red-500 font-medium"
                                                                : "text-muted-foreground hover:text-foreground"
                                                        )}
                                                        onClick={() => {
                                                            if (window.innerWidth < 1024) {
                                                                toggleSidebar();
                                                            }
                                                        }}
                                                    >
                                                        <SubIcon className="mr-2 h-8 w-8" />
                                                        {subItem.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Pied de page de la sidebar */}
                    <div className="p-4 border-t">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-semibold">U</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Utilisateur</p>
                                <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}