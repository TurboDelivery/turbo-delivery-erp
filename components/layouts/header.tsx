'use client';

import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconCaretDown from '@/components/icon/icon-caret-down';

import { usePathname } from 'next/navigation';
import { getTranslation } from '@/i18n';
import { Logo } from '../icons';
import menuData, { IMenuData } from '@/config/menu-data';
import { User } from '@/types/models';

const Sidebar = ({ profile }: { profile: User }) => {
    const dispatch = useDispatch();
    const { t } = getTranslation();
    const pathname = usePathname();

    // 🔥 moteur stable pour menus imbriqués
    const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [pathname]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className="sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow transition-all">
                <div className="h-full bg-white dark:bg-black flex flex-col">

                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                        <Logo className="w-20 py-2" />
                        <button onClick={() => dispatch(toggleSidebar())}>
                            <IconCaretsDown className="rotate-90" />
                        </button>
                    </div>

                    <PerfectScrollbar className="flex-1">
                        <ul className="p-3 space-y-1 font-semibold">
                            <RenderMenu
                                menu={menuData}
                                openMenus={openMenus}
                                toggleMenu={toggleMenu}
                                t={t}
                            />
                        </ul>
                    </PerfectScrollbar>

                </div>
            </nav>
        </div>
    );
};

export default Sidebar;

/* ============================
        MENU RÉCURSIF
============================ */

function RenderMenu({
    menu,
    openMenus,
    toggleMenu,
    level = 0,
    t,
}: {
    menu: IMenuData[];
    openMenus: Set<string>;
    toggleMenu: (key: string) => void;
    level?: number;
    t: (value: string) => string;
}) {
    return (
        <>
            {menu.map((item, index) => {
                const key = `${level}-${item.title}-${index}`;
                const isOpen = openMenus.has(key);
                const hasChildren = item.children && item.children.length > 0;

                return (
                    <li key={key}>
                        {hasChildren ? (
                            <>
                                <button
                                    onClick={() => toggleMenu(key)}
                                    className={`w-full flex justify-between items-center px-3 py-2 rounded transition
                                        ${isOpen ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon && <item.icon className="w-5 h-5" />}
                                        <span>{t(item.title)}</span>
                                    </div>
                                    <IconCaretDown className={`transition ${isOpen ? '' : '-rotate-90'}`} />
                                </button>

                                <AnimateHeight duration={250} height={isOpen ? 'auto' : 0}>
                                    <ul className="mt-1 ml-4 border-l border-gray-300 dark:border-gray-700 pl-3 space-y-1">
                                        <RenderMenu
                                            menu={item.children!}
                                            openMenus={openMenus}
                                            toggleMenu={toggleMenu}
                                            level={level + 1}
                                            t={t}
                                        />
                                    </ul>
                                </AnimateHeight>
                            </>
                        ) : (
                            <Link
                                href={item.path ?? ''}
                                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                {item.icon && <item.icon className="w-5 h-5" />}
                                <span>{t(item.title)}</span>
                            </Link>
                        )}
                    </li>
                );
            })}
        </>
    );
}