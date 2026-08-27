import menuData, { IMenuData, correspond } from '@/config/menu-data';
import type { AppAbility, AppActions, AppSubjects } from '@/lib/casl/ability';

const ALWAYS_ALLOWED_PATHS = ['/', '/analystics', '/settings/profile'];

type Rule = { action: AppActions; subject: AppSubjects };

/**
 * Regles des ecrans qui n'ont PAS d'entree de menu.
 *
 * <p>L'autorisation d'une route se derive normalement du menu : chaque entree
 * declare son `can`, et `canAccessRoute` le retrouve. Restaient sept ecrans REELS
 * absents du menu, donc sans aucune regle — et le defaut de cette fonction etait
 * `true`, si bien qu'ils etaient ouverts a TOUT COMPTE CONNECTE, `/finance` et
 * `/finance/depense` compris.</p>
 *
 * <p>Ils ne sont pas ajoutes au menu : cela creerait des entrees visibles que
 * personne n'a demandees. Ils sont declares ici, et les regles suivent celles de
 * leurs voisins immediats plutot que d'inventer un decoupage :</p>
 * <ul>
 *   <li>`read Finance` est ce qu'utilisent deja /finance/dashboard,
 *       /finance/recouvrement, /finance/revenue et /finance/facturation-plage.
 *       Ouvre a COMPTABLE, DG, DGA, RECOUVREUR, TRESORIER ;</li>
 *   <li>`read Depense` pour les deux ecrans de depenses, qui rendent d'ailleurs le
 *       MEME composant. Ouvre a COMPTABLE, DG, DGA ;</li>
 *   <li>`read Restaurant` pour les types de plats, qui relevent du catalogue
 *       partenaire. Ouvre aux 10 roles operationnels.</li>
 * </ul>
 *
 * <p>Verifie sur la matrice role x route : DG, DGA et COMPTABLE passent partout.</p>
 */
const REGLES_HORS_MENU: Record<string, Rule> = {
  '/finance': { action: 'read', subject: 'Finance' },
  '/finance/cycle-facturation': { action: 'read', subject: 'Finance' },
  '/finance/entrees-caisse': { action: 'read', subject: 'Finance' },
  '/finance/revenus-encaisses': { action: 'read', subject: 'Finance' },
  '/finance/depense': { action: 'read', subject: 'Depense' },
  '/finance/sorties': { action: 'read', subject: 'Depense' },
  '/type-plat': { action: 'read', subject: 'Restaurant' },
};

const findRuleForPath = (menus: IMenuData[], path: string): Rule | null => {
  for (const item of menus) {
    if (item.path === path && item.can) return item.can;
    if (item.children) {
      const childRule = findRuleForPath(item.children, path);
      if (childRule) return childRule;
    }
  }
  return null;
};

/**
 * Regle heritee du chemin declare le plus long qui couvre `path`.
 *
 * <p>La correspondance passe par `correspond`, donc par SEGMENT. Avec un
 * `startsWith` brut, `/settings/profil-x` heritait des droits de
 * `/settings/profile`, et `/trafic-archive` de ceux de `/trafic` : deux ecrans
 * differents partageaient une autorisation par simple voisinage de lettres.</p>
 */
const findRuleForPrefix = (menus: IMenuData[], path: string): Rule | null => {
  let bestRule: Rule | null = null;
  let bestLength = 0;
  const walk = (list: IMenuData[]) => {
    for (const item of list) {
      if (item.path && item.can && item.path !== '/' && correspond(item.path, path)) {
        if (item.path.length > bestLength) {
          bestRule = item.can;
          bestLength = item.path.length;
        }
      }
      if (item.children) walk(item.children);
    }
  };
  walk(menus);
  return bestRule;
};

/**
 * L'utilisateur a-t-il le droit d'ouvrir cette route ?
 *
 * <p>Le defaut est FERME. Il valait `true` : toute route absente du menu etait
 * accessible a n'importe quel compte connecte, quel que soit son role. Une route
 * neuve arrivait donc ouverte par defaut, sans que rien ne le signale.</p>
 *
 * <p>Fermer par defaut a un prix : une route creee sans regle devient
 * inaccessible A TOUS. C'est le bon sens de l'echec — on s'en apercoit tout de
 * suite, alors qu'une porte laissee ouverte ne se voit jamais. Toute route neuve
 * doit donc declarer son `can` dans le menu, ou etre ajoutee a
 * `REGLES_HORS_MENU`.</p>
 */
export const canAccessRoute = (ability: AppAbility, path: string): boolean => {
  if (ALWAYS_ALLOWED_PATHS.includes(path)) return true;

  const exactRule = findRuleForPath(menuData, path);
  if (exactRule) return ability.can(exactRule.action, exactRule.subject);

  const regleHorsMenu = REGLES_HORS_MENU[path];
  if (regleHorsMenu) return ability.can(regleHorsMenu.action, regleHorsMenu.subject);

  const prefixRule = findRuleForPrefix(menuData, path);
  if (prefixRule) return ability.can(prefixRule.action, prefixRule.subject);

  // Aucune regle : on refuse. Voir la note ci-dessus sur le sens de l'echec.
  return false;
};
