'use client';

import { TbTruckDelivery } from 'react-icons/tb';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { Bell, ShoppingCartIcon, SquareUser, Ticket } from 'lucide-react';
import { IconBuildingSkyscraper, IconLayoutDashboard, IconMap, IconMotorbike, IconSettings2, IconUsers, IconUsersGroup } from '@tabler/icons-react';

export interface IMenuData {
    isHeader?: boolean;
    title: string;
    icon?: React.ElementType;
    path?: string;
    children?: IMenuData[];
}

const menuData: IMenuData[] = [
    { icon: IconLayoutDashboard, title: 'dashboard', path: '/' },
    {
        icon: IconMap,
        title: 'Trafic',
        children: [
            { icon: IconMap, title: 'Localisation des Turboys (Maps)', path: '/trafic' },
            { icon: SquareUser, title: "File d'attente", path: '/file-attente' },
        ],
    },
    { icon: ShoppingCartIcon, title: 'Commandes / Client', path: '/commandes' },
    {
        icon: TbTruckDelivery,
        title: 'external_delivery',
        children: [
            { icon: TbTruckDelivery, title: 'Nouvelles courses', path: '/external_delivery' },  
            { icon: TbTruckDelivery, title: 'Courses Journalières', path: '/new-deliveries' },
            { icon: TbTruckDelivery, title: 'Toutes les courses', path: '/external_delivery/all' },
            { icon: Ticket, title: 'Tickets', path: '/tickets' },
        ],
    },
    {
        icon: IconBuildingSkyscraper,
        title: 'restaurants',
        children: [
            { icon: IconBuildingSkyscraper, title: 'Partners validés', path: '/restaurants' },
            { icon: IconBuildingSkyscraper, title: 'Partners partiellement validés', path: '/restaurants/valide' },
            { icon: IconBuildingSkyscraper, title: 'News Partners', path: '/restaurants/not-valide' },
            { icon: AiOutlineDollarCircle, title: 'Grille tarifaire', path: '/price-list' },
        ],
    },
    {
        icon: IconMotorbike,
        title: 'Livreurs',
        children: [
            { icon: IconMotorbike, title: 'Liste', path: '/delivery-men' },
            { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/creneau-progression' },
            { icon: IconBuildingSkyscraper, title: 'performance', path: '/delivery-men/performance' },
        ],
    },
    {
        icon: IconUsers,
        title: 'users',
        children: [{ icon: IconUsersGroup, title: 'users', path: '/users' }],
    },
    { icon: Bell, title: 'Notifications', path: '/notification' },
    { icon: IconSettings2, title: 'Paramètres', path: '/settings/profile' },
];

export default menuData;
