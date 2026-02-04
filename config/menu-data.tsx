'use client';
import {
    IconBuildingSkyscraper,
    IconLayoutDashboard,
    IconMap,
    IconMotorbike,
    IconSettings2,
    IconUsers,
    IconUsersGroup
} from '@tabler/icons-react';
import { Bell, ChartNoAxesCombined, Euro, Layers, List, ShoppingCartIcon, SquareUser, Ticket, Truck, WalletCards } from 'lucide-react';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { TbTruckDelivery } from 'react-icons/tb';
//import { TbMoneybag } from 'react-icons/tb';
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
            // { icon: TbMoneybag, title: 'gestion_de_paie', path: '/external_delivery/gestion_de_paie' },
        ],
    },
    // { icon: AiOutlineDollarCircle, title: 'price-list', path: '/price-list' },

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
            // { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/slot' },
            { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/creneau-progression' },
            { icon: IconBuildingSkyscraper, title: 'performance', path: '/delivery-men/performance' },
        ],
    },

    {
        icon: IconUsers,
        title: 'users',
        children: [{ icon: IconUsersGroup, title: 'users', path: '/users' }],
    },
    {
        icon: IconMap,
        title: 'finance',
        children: [
            { icon: IconMap, title: 'finance dashboard ', path: '/finance/' },
            { icon: IconMap, title: 'Depenses ', path: '/finance/depense' },
            { icon: List, title: "Cumule de revenus globaux", path: '/finance/revenue' },
            // { icon: Truck, title: "Cumule des frais de livraison", path: '/finance/revenue/livraison' },
            // { icon: ChartNoAxesCombined, title: "Cumule des frais de pourcentage (%)", path: '/finance/revenue/commission_pourcentage' },
            // { icon: Euro, title: "Cumule des frais de commission fixe(fixe)", path: '/finance/revenue/commission_fixe' },
            { icon: Layers, title: "Cumule des investissements internes", path: '/finance/revenue/investissement' },
            { icon: SquareUser, title: "Recouvrements", path: '/finance/recouvrement' },

        ],
    },

   
    // {
    //     isHeader: true,
    //     title: 'database',
    //     icon: IconDatabase,
    //     children: [
            
    //         {
    //             icon: HandPlatter,
    //             title: 'type_plats',
    //             path: '/type-plat',
    //         },
    //     ],
    // },
    // { isHeader: true, icon: IconSettings2, title: 'settings', children: [{ icon: IconUser, title: 'profile', path: '/settings/profile' }] },
    { icon: Bell, title: 'Notifications', path: '/notification' },
    { icon: IconSettings2, title: 'Paramètres', path: '/settings/profile' },
];

export default menuData;
