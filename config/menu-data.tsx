/**
 * PAS de `'use client'` ici, et c'est essentiel.
 *
 * <p>Ce module n'exporte que des DONNEES et des fonctions PURES. La directive y a
 * pourtant vecu, et elle a provoque la panne du 27/08/2026 : `utils/route-permission.ts`
 * importe `menuData` et `correspond`, et la garde d'acces de `app/(protected)/layout.tsx`
 * — un composant SERVEUR — fait `for (const item of menuData)`. Sur un module marque
 * client, le serveur ne recoit pas le tableau mais une REFERENCE client ; iterer dessus
 * lit `Symbol.iterator` et leve :</p>
 * <pre>
 *   Cannot read Symbol exports. Only named exports are supported
 *   on a client module imported on the server.
 * </pre>
 * <p>Toutes les pages authentifiees hors `/analystics` et `/settings/profile` rendaient
 * donc un 500 opaque. Invisible partout en amont : `tsc` ne modelise pas la frontiere
 * et voit les vrais types, et `next build` compile sans le moindre avertissement.</p>
 *
 * <p>Les ICONES importees ci-dessous sont, elles, des composants clients. C'est sans
 * consequence : on se contente de STOCKER la reference dans `icon`, jamais de l'appeler
 * ni de la lire cote serveur. Seule la barre laterale, qui est cliente, les rend.</p>
 *
 * <p>⚠ Ne rien ajouter ici qui s'execute a l'import (hook, acces a `window`, etat) :
 * ce module est desormais dans le graphe SERVEUR.</p>
 */
import { IconBuildingSkyscraper, IconLayoutDashboard, IconMap, IconMotorbike, IconSettings2, IconShieldLock, IconUser, IconUsers } from '@tabler/icons-react';
import { AlertTriangle, BarChart, Bell, CheckCircle, FileText, History, Layers, List, Lock, Receipt, ShoppingCartIcon, SquareUser, Ticket, TrendingUp, Wallet } from 'lucide-react';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { TbTruckDelivery } from 'react-icons/tb';
import type { AppAbility, AppActions, AppSubjects } from '@/lib/casl/ability';

export interface IMenuData {
  isHeader?: boolean;
  title: string;
  icon?: React.ElementType;
  path?: string;
  children?: IMenuData[];
  can?: { action: AppActions; subject: AppSubjects };
}

const menuData: IMenuData[] = [
  { icon: IconLayoutDashboard, title: 'dashboard', path: '/analystics', can: { action: 'access', subject: 'Analytics' } },
  {
    icon: IconMap,
    title: 'Trafic',
    can: { action: 'read', subject: 'Trafic' },
    children: [
      { icon: IconMap, title: 'Localisation des Turboys (Maps)', path: '/trafic', can: { action: 'read', subject: 'Trafic' } },
      { icon: SquareUser, title: "File d'attente", path: '/file-attente', can: { action: 'read', subject: 'Trafic' } },
      { icon: AlertTriangle, title: 'Centre de contrôle STANDARD', path: '/trafic/standard', can: { action: 'read', subject: 'Incident' } },
    ],
  },
  { icon: ShoppingCartIcon, title: 'Commandes / Client', path: '/commandes', can: { action: 'read', subject: 'CommandeClient' } },
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
      { icon: Lock, title: 'Régularisation', path: '/validation-tickets/regularisation', can: { action: 'read', subject: 'ValidationTicket' } },
      { icon: Lock, title: 'Verification V1', path: '/validation-tickets/verification-v1', can: { action: 'read', subject: 'VerificationV1' } },
      { icon: Lock, title: 'Verrouillage V2', path: '/validation-tickets/verrouillage-v2', can: { action: 'read', subject: 'VerrouillageV2' } },
      { icon: Receipt, title: 'Grille de paiement', path: '/validation-tickets/grille-de-paiement', can: { action: 'read', subject: 'GrillePaiement' } },
      { icon: CheckCircle, title: 'Visa DGA', path: '/validation-tickets/visa-dga', can: { action: 'valider-dga', subject: 'Depense' } },
      { icon: CheckCircle, title: 'Approbation finale', path: '/validation-tickets/approbation-finale', can: { action: 'approuver-dg', subject: 'PageApprobationFinale' } },
      { icon: History, title: 'Historique des Créneaux', path: '/validation-tickets/historique-creneaux', can: { action: 'read', subject: 'HistoriqueCreneaux' } },
    ],
  },
  {
    icon: IconBuildingSkyscraper,
    title: 'Partenaires',
    can: { action: 'read', subject: 'Restaurant' },
    children: [
      { icon: IconBuildingSkyscraper, title: 'Liste', path: '/restaurants', can: { action: 'read', subject: 'Restaurant' } },
      { icon: Layers, title: 'Groupes', path: '/restaurants/groupes', can: { action: 'read', subject: 'GroupePartenaire' } },
      { icon: AiOutlineDollarCircle, title: 'Grille tarifaire', path: '/price-list', can: { action: 'read', subject: 'Restaurant' } },
      { icon: BarChart, title: 'Rapports Performance', path: '/finance/rapports-performance', can: { action: 'read', subject: 'RapportPerformancePartenaire' } },
    ],
  },
  {
    icon: IconMotorbike,
    title: 'Turboys',
    can: { action: 'read', subject: 'Livreur' },
    children: [
      // { icon: IconMotorbike, title: 'Liste', path: '/delivery-men', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/creneaux', can: { action: 'read', subject: 'Creneau' } },
      { icon: IconBuildingSkyscraper, title: 'Programmes hebdo', path: '/delivery-men/programmes', can: { action: 'read', subject: 'Creneau' } },
      { icon: IconMotorbike, title: 'Men', path: '/delivery-men/men', can: { action: 'read', subject: 'Livreur' } },
      // Arbitrage des pointages hors-zone (règle owner 2026-07-31) — un pointage
      // validé compte (et fait entrer en file d'attente si c'est la montée).
      { icon: IconMotorbike, title: 'Pointages à valider', path: '/delivery-men/pointages-a-valider', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconBuildingSkyscraper, title: 'performance', path: '/delivery-men/performance', can: { action: 'read', subject: 'Performance' } },
      { icon: History, title: 'Reporting & historisation', path: '/reporting', can: { action: 'read', subject: 'Reporting' } },
    ],
  },
  {
    icon: IconUser,
    title: 'Personnel TURBO',
    path: '/personnel',
    can: { action: 'read', subject: 'Personnel' },
  },
  {
    icon: IconShieldLock,
    title: 'Supervision & Audit',
    path: '/supervision',
    can: { action: 'read', subject: 'Supervision' },
  },
  {
    icon: IconUsers,
    title: 'Utilisateurs actif',
    path: '/users',
    can: { action: 'read', subject: 'Utilisateur' },
  },
  {
    icon: Lock,
    title: 'Privilèges',
    path: '/privileges',
    can: { action: 'read', subject: 'Utilisateur' },
  },
  {
    icon: IconMap,
    title: 'Finance',
    can: { action: 'read', subject: 'Finance' },
    children: [
      { icon: IconMap, title: 'Tableau de bord', path: '/finance/dashboard', can: { action: 'read', subject: 'Finance' } },
      { icon: CheckCircle, title: 'Validation', path: '/finance/validation', can: { action: 'read', subject: 'ChargeFixe' } },
      { icon: TrendingUp, title: 'Analyse de Rentabilité', path: '/finance/analyse-rentabilite', can: { action: 'read', subject: 'Finance' } },
      { icon: TrendingUp, title: 'Rentabilité (temps réel)', path: '/finance/rentabilite', can: { action: 'read', subject: 'Finance' } },
      { icon: FileText, title: 'Rapports Financiers', path: '/finance/rapports-financiers', can: { action: 'read', subject: 'Finance' } },
      { icon: Wallet, title: 'Gestion des Paiements', path: '/finance/gestion-paiements', can: { action: 'read', subject: 'Paiement' } },
      { icon: List, title: 'Cumule de revenus globaux', path: '/finance/revenue', can: { action: 'read', subject: 'Finance' } },
      { icon: Layers, title: 'Cumule des investissements internes', path: '/finance/revenue/investissement', can: { action: 'read', subject: 'Finance' } },
      { icon: SquareUser, title: 'Recouvrements', path: '/finance/recouvrement', can: { action: 'read', subject: 'Finance' } },
      { icon: BarChart, title: 'Dashboard Performance', path: '/finance/rapports-performance/dashboard-performance', can: { action: 'read', subject: 'DashboardPerformance' } },
      { icon: Receipt, title: 'Facturation partenaire', path: '/finance/facturation-plage', can: { action: 'read', subject: 'Finance' } },
      { icon: IconSettings2, title: 'Configuration', path: '/finance/configuration', can: { action: 'read', subject: 'PageFinanceConfig' } },
      { icon: IconSettings2, title: 'Primes & commission', path: '/finance/primes', can: { action: 'read', subject: 'GrillePaiement' } },
    ],
  },
  {
    icon: FileText,
    title: 'Comptabilité',
    can: { action: 'read', subject: 'Finance' },
    children: [
      // 2026-05 — Permissions granulaires sur les 4 sous-menus Comptabilité.
      // Le RECOUVREUR ne voit QUE Agent Recouvreur. Le COMPTABLE (Responsable
      // Financier dans le workflow) voit Responsable Financier + Caissier.
      // Les DG/DGA voient tout via 'manage all' / 'read all'.
      { icon: FileText, title: 'Responsable Financier', path: '/finance/comptabilite/responsable-financier', can: { action: 'read', subject: 'PageResponsableFinancier' } },
      { icon: FileText, title: 'Agent Recouvreur', path: '/finance/comptabilite/agent-recouvreur', can: { action: 'read', subject: 'PageAgentRecouvreur' } },
      { icon: Wallet, title: 'Caissier', path: '/finance/comptabilite/caissier', can: { action: 'read', subject: 'PageCaissier' } },
      { icon: CheckCircle, title: 'Validation DGA', path: '/finance/comptabilite/validation-dga', can: { action: 'read', subject: 'PageValidationDga' } },
      // SPEC-RECOUV-002 — aval du visa : orientation des fonds (DG/DGA) + vérification des dépôts.
      { icon: Wallet, title: 'Orientation des fonds', path: '/finance/comptabilite/orientation-fonds', can: { action: 'read', subject: 'OrientationFonds' } },
      { icon: CheckCircle, title: 'Vérification dépôts', path: '/finance/comptabilite/verification-depots', can: { action: 'read', subject: 'VerificationDepots' } },
      // ENCOURS — relevé des restes à payer (factures éditées non recouvrées), par mois/an.
      { icon: TrendingUp, title: 'Encours', path: '/finance/comptabilite/encours', can: { action: 'read', subject: 'PageEncours' } },
    ],
  },
  { icon: Bell, title: 'Notifications', path: '/notification', can: { action: 'access', subject: 'Notification' } },
  { icon: IconSettings2, title: 'Paramètres', path: '/settings/profile', can: { action: 'access', subject: 'Parametre' } },
];

export default menuData;

/**
 * Menu reduit a ce que le role a le droit de voir.
 *
 * <p>Vivait dans `components/layouts/sidebar.tsx` et n'existait QUE la : le menu
 * horizontal de `components/layouts/header.tsx` rendait `menuData` brut, donc non
 * filtre. Invisible tant que `themeConfig.menu` vaut « vertical » (le defaut),
 * mais `App.tsx` lit ce reglage dans `localStorage` : la valeur « horizontal » est
 * atteignable, et le menu y listait alors des entrees interdites au role.</p>
 */
export const filterMenuByAbility = (menu: IMenuData[], ability: AppAbility): IMenuData[] => {
  return menu.reduce<IMenuData[]>((acc, item) => {
    const children = item.children ? filterMenuByAbility(item.children, ability) : undefined;
    const allowedBySelf = item.can ? ability.can(item.can.action, item.can.subject) : false;
    const allowedByChild = !!children && children.length > 0;

    if (!item.can && !item.children) return acc;
    if (!allowedBySelf && !allowedByChild) return acc;

    acc.push(children !== undefined ? { ...item, children } : item);
    return acc;
  }, []);
};

/** Toutes les cibles declarees dans le menu, a plat. */
export const collecterChemins = (menu: IMenuData[]): string[] =>
  menu.flatMap((i) => [...(i.path ? [i.path] : []), ...(i.children ? collecterChemins(i.children) : [])]);

/**
 * Correspondance par SEGMENT, jamais par prefixe brut.
 *
 * <p>Sans le `/` final, `/delivery-men/performance` matcherait
 * `/delivery-men/performance-apercue/xxx`, qui est un autre ecran.</p>
 */
export const correspond = (cheminMenu: string, pathname: string) =>
  pathname === cheminMenu || pathname.startsWith(cheminMenu + '/');

/**
 * Groupe (entree a sous-menu) qui contient la route courante.
 *
 * <p>Recursif A DESSEIN. Aucune entree n'utilise `isHeader` aujourd'hui, donc une
 * recherche au premier niveau suffirait ; mais le rendu SAIT deja imbriquer un
 * groupe sous un en-tete de section, et cette recherche cesserait alors de trouver
 * le groupe SANS que rien ne le signale : ni le compilateur, ni le build.</p>
 */
export const trouverGroupeParent = (menu: IMenuData[], pathname: string | null): IMenuData | undefined => {
  for (const item of menu) {
    if (item.children?.some((c) => c.path && correspond(c.path, pathname ?? ''))) return item;
    const dansEnfants = item.children ? trouverGroupeParent(item.children, pathname) : undefined;
    if (dansEnfants) return dansEnfants;
  }
  return undefined;
};

/**
 * Entree de menu a surligner. Le plus long chemin qui correspond gagne, sinon les
 * paires parent/enfant s'allument a deux : `/trafic` contre `/trafic/standard`,
 * `/restaurants` contre `/restaurants/groupes`.
 */
export const trouverCheminActif = (menu: IMenuData[], pathname: string | null): string =>
  collecterChemins(menu)
    .filter((cm) => correspond(cm, pathname ?? ''))
    .sort((a, b) => b.length - a.length)[0] ?? '';
