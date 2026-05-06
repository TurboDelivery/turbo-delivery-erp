'use client';
import { IconBuildingSkyscraper, IconLayoutDashboard, IconMap, IconMotorbike, IconSettings2, IconUser, IconUsers } from '@tabler/icons-react';
import { BarChart, Bell, CheckCircle, FileText, Layers, List, Lock, Receipt, ShoppingCartIcon, SquareUser, Ticket, TrendingUp, Wallet } from 'lucide-react';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { TbTruckDelivery } from 'react-icons/tb';
import type { AppActions, AppSubjects } from '@/lib/casl/ability';

export interface IMenuData {
  isHeader?: boolean;
  title: string;
  icon?: React.ElementType;
  path?: string;
  children?: IMenuData[];
  can?: { action: AppActions; subject: AppSubjects };
}

const menuData: IMenuData[] = [
  { icon: IconLayoutDashboard, title: 'dashboard', path: '/', can: { action: 'access', subject: 'Analytics' } },
  {
    icon: IconMap,
    title: 'Trafic',
    can: { action: 'read', subject: 'Trafic' },
    children: [
      { icon: IconMap, title: 'Localisation des Turboys (Maps)', path: '/trafic', can: { action: 'read', subject: 'Trafic' } },
      { icon: SquareUser, title: "File d'attente", path: '/file-attente', can: { action: 'read', subject: 'Trafic' } },
    ],
  },
  { icon: ShoppingCartIcon, title: 'Commandes / Client', path: '/commandes', can: { action: 'read', subject: 'Commande' } },
  {
    icon: TbTruckDelivery,
    title: 'external_delivery',
    can: { action: 'read', subject: 'Ticket' },
    children: [
      { icon: TbTruckDelivery, title: 'Nouvelles courses', path: '/external_delivery', can: { action: 'read', subject: 'Commande' } },
      { icon: TbTruckDelivery, title: 'Courses Journalières', path: '/new-deliveries', can: { action: 'read', subject: 'Commande' } },
      { icon: TbTruckDelivery, title: 'Toutes les courses', path: '/external_delivery/all', can: { action: 'read', subject: 'Commande' } },
      { icon: Ticket, title: 'Tickets', path: '/tickets', can: { action: 'read', subject: 'Ticket' } },
    ],
  },
  {
    title: 'Validation des tickets',
    icon: Lock,
    children: [
      { icon: Lock, title: 'Verification V1', path: '/validation-tickets/verification-v1', can: { action: 'manage', subject: 'Ticket' } },
      { icon: Lock, title: 'Régularisation', path: '/validation-tickets/regularisation', can: { action: 'manage', subject: 'Ticket' } },
      { icon: Receipt, title: 'Grille de paiement', path: '/validation-tickets/grille-de-paiement', can: { action: 'manage', subject: 'Ticket' } },
      { icon: CheckCircle, title: 'Visa DGA', path: '/validation-tickets/visa-dga', can: { action: 'valider-dga', subject: 'Depense' } },
    ],
  },
  {
    icon: IconBuildingSkyscraper,
    title: 'Partenaires',
    can: { action: 'read', subject: 'Restaurant' },
    children: [
      { icon: IconBuildingSkyscraper, title: 'Partners validés', path: '/restaurants', can: { action: 'read', subject: 'Restaurant' } },
      { icon: IconBuildingSkyscraper, title: 'Partners partiellement validés', path: '/restaurants/valide', can: { action: 'valider', subject: 'Restaurant' } },
      { icon: IconBuildingSkyscraper, title: 'News Partners', path: '/restaurants/not-valide', can: { action: 'valider', subject: 'Restaurant' } },
      { icon: AiOutlineDollarCircle, title: 'Grille tarifaire', path: '/price-list', can: { action: 'read', subject: 'Restaurant' } },
      { icon: BarChart, title: 'Rapports Performance', path: '/finance/rapports-performance', can: { action: 'read', subject: 'Performance' } },
    ],
  },
  {
    icon: IconMotorbike,
    title: 'Turboys',
    can: { action: 'read', subject: 'Livreur' },
    children: [
      { icon: IconMotorbike, title: 'Liste', path: '/delivery-men', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/creneaux', can: { action: 'read', subject: 'Creneau' } },
      { icon: IconMotorbike, title: 'Men', path: '/delivery-men/men', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconBuildingSkyscraper, title: 'performance', path: '/delivery-men/performance', can: { action: 'read', subject: 'Performance' } },
    ],
  },
  {
    icon: IconUser,
    title: 'Personnel TURBO',
    path: '/personnel',
    can: { action: 'read', subject: 'Personnel' },
  },
  {
    icon: IconUsers,
    title: 'Utilisateurs actif',
    path: '/users',
    can: { action: 'read', subject: 'Utilisateur' },
  },
  {
    icon: IconMap,
    title: 'Finance',
    can: { action: 'read', subject: 'Finance' },
    children: [
      // { icon: IconMap, title: 'Tableau de bord ', path: '/finance/', can: { action: 'read', subject: 'Finance' } },
      { icon: Receipt, title: 'Charges', path: '/finance/charges', can: { action: 'read', subject: 'ChargeFixe' } },
      { icon: CheckCircle, title: 'Validation', path: '/finance/validation', can: { action: 'read', subject: 'ChargeFixe' } },
      { icon: TrendingUp, title: 'Analyse de Rentabilité', path: '/finance/analyse-rentabilite', can: { action: 'read', subject: 'Finance' } },
      { icon: FileText, title: 'Rapports Financiers', path: '/finance/rapports-financiers', can: { action: 'read', subject: 'Finance' } },
      { icon: Wallet, title: 'Gestion des Paiements', path: '/finance/gestion-paiements', can: { action: 'read', subject: 'Paiement' } },
      { icon: List, title: 'Cumule de revenus globaux', path: '/finance/revenue', can: { action: 'read', subject: 'Finance' } },
      { icon: Layers, title: 'Cumule des investissements internes', path: '/finance/revenue/investissement', can: { action: 'read', subject: 'Finance' } },
      { icon: SquareUser, title: 'Recouvrements', path: '/finance/recouvrement', can: { action: 'read', subject: 'Finance' } },
      { icon: BarChart, title: 'Dashboard Performance', path: '/finance/rapports-performance/dashboard-performance', can: { action: 'read', subject: 'Performance' } },
    ],
  },
  { icon: Bell, title: 'Notifications', path: '/notification', can: { action: 'access', subject: 'Notification' } },
  { icon: IconSettings2, title: 'Paramètres', path: '/settings/profile', can: { action: 'access', subject: 'Parametre' } },
];

export default menuData;
