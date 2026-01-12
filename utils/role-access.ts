'use client';

import { User } from '@/types/models';
import menuData, { IMenuData } from '@/config/menu-data';

const ALWAYS_ALLOWED_PATHS = ['/analystics', '/'];

export const canAccessRoute = (profile: User, path: string): boolean => {
    // ✅ Accès universel analytics
    if (ALWAYS_ALLOWED_PATHS.includes(path)) {
        return true;
    }

    const role = profile.role.libelle.toLowerCase();
    let allowedMenus: IMenuData[] = [];

    if (role === 'standard' || role === "centrale d'appel") {
        allowedMenus = menuData
            .filter((item) =>
                ['external_delivery', 'trafic', 'paramètres'].includes(item.title.toLowerCase())
            )
            .map((item) => {
                if (item.title.toLowerCase() === 'external_delivery') {
                    return {
                        ...item,
                        children: item.children?.filter(
                            c => c.title.toLowerCase() === 'tickets'
                        ),
                    };
                }
                return item;
            });
    } 
    else if (role === 'comptable' || role === 'ops manager') {
        allowedMenus = menuData
            .filter((item) =>
                ['external_delivery', 'livreurs', 'restaurants', 'paramètres'].includes(item.title.toLowerCase())
            )
            .map((item) => {
                if (item.title.toLowerCase() === 'external_delivery') {
                    return {
                        ...item,
                        children: item.children?.filter(
                            c => c.title.toLowerCase() === 'tickets'
                        ),
                    };
                }

                if (role === 'comptable' && item.title.toLowerCase() === 'livreurs') {
                    return {
                        ...item,
                        children: item.children?.filter(
                            c => c.title.toLowerCase() === 'liste'
                        ),
                    };
                }

                if (role === 'comptable' && item.title.toLowerCase() === 'restaurants') {
                    return {
                        ...item,
                        children: item.children?.filter(
                            c => c.title.toLowerCase() === 'partners validés'
                        ),
                    };
                }

                return item;
            });
    } 
    else {
        // Admin / Super admin
        return true;
    }

    // 2. Collecte des paths autorisés
    const paths: string[] = [];

    const collectPaths = (menus: IMenuData[]) => {
        menus.forEach(menu => {
            if (menu.path) paths.push(menu.path);
            if (menu.children) collectPaths(menu.children);
        });
    };

    collectPaths(allowedMenus);

    return paths.includes(path);
};
