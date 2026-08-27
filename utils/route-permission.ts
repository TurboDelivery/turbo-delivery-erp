import menuData, { IMenuData, correspond } from '@/config/menu-data';
import type { AppAbility, AppActions, AppSubjects } from '@/lib/casl/ability';

const ALWAYS_ALLOWED_PATHS = ['/', '/analystics', '/settings/profile'];

type Rule = { action: AppActions; subject: AppSubjects };

/**
 * Regle candidate accompagnee de la LONGUEUR du chemin qui l'a fournie.
 *
 * <p>Le menu et la table hors-menu sont deux sources concurrentes. Sans porter la
 * longueur, on serait oblige de consulter l'une avant l'autre, et la premiere
 * gagnerait meme quand la seconde est plus precise : une regle large posee sur
 * `/delivery-men` masquerait `/delivery-men/performance` declaree dans le menu.
 * On compare donc les deux candidats, et le chemin le plus long l'emporte.</p>
 */
type Candidat = { regle: Rule | null; longueur: number };

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

  /**
   * Tout le parc coursiers. SEIZE ecrans reels vivaient sous `/delivery-men` sans
   * aucune regle : le groupe « Turboys » du menu porte bien `read Livreur`, mais il
   * n'a PAS de `path` — or `findRuleForPath` exige `item.path === path` et
   * `findRuleForPrefix` exige `item.path && item.can`. Un groupe sans chemin ne
   * couvre donc rien. La seule declaration qui aurait couvert le segment est
   * commentee dans le menu depuis `842e65e7`, ce qui etait inoffensif tant que le
   * defaut valait `true`, et fatal depuis qu'il vaut `false` : /delivery-men,
   * /delivery-men/valide, /not-valide, /assigned, /birds, /turboys, /requests,
   * /slot, /creneau-progression, /profil/[id]... etaient refuses a TOUS les roles,
   * DG compris — et la carte « Comptes en attente » du tableau de bord, visible de
   * tous, y menait droit.
   */
  '/delivery-men': { action: 'read', subject: 'Livreur' },

  /**
   * Cet ecran heritait de `read Performance` (declare sur /delivery-men/performance)
   * tant que la comparaison se faisait par `startsWith` brut. Le passage a la
   * correspondance par SEGMENT etait correct — `/performance` ne doit pas couvrir
   * `/performance-apercue` — mais aucune regle de remplacement n'a ete donnee.
   * Declaree ici, plus longue que `/delivery-men`, elle gagne donc la resolution.
   */
  '/delivery-men/performance-apercue': { action: 'read', subject: 'Performance' },
};

/**
 * Regle hors-menu couvrant `path`, par SEGMENT et non par egalite stricte.
 *
 * <p>La table etait consultee en correspondance EXACTE (`REGLES_HORS_MENU[path]`).
 * Une regle posee sur `/delivery-men` ne couvrait donc pas `/delivery-men/valide`,
 * et il aurait fallu enumerer a la main les seize routes du segment — y compris les
 * routes dynamiques, impossibles a enumerer. On applique donc la meme regle que pour
 * le menu : le chemin declare le PLUS LONG qui couvre la route l'emporte.</p>
 */
const trouverRegleHorsMenu = (path: string): Candidat => {
  let candidat: Candidat = { regle: null, longueur: 0 };
  for (const [chemin, regle] of Object.entries(REGLES_HORS_MENU)) {
    if (correspond(chemin, path) && chemin.length > candidat.longueur) {
      candidat = { regle, longueur: chemin.length };
    }
  }
  return candidat;
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
const findRuleForPrefix = (menus: IMenuData[], path: string): Candidat => {
  let candidat: Candidat = { regle: null, longueur: 0 };
  const walk = (list: IMenuData[]) => {
    for (const item of list) {
      if (item.path && item.can && item.path !== '/' && correspond(item.path, path)) {
        if (item.path.length > candidat.longueur) {
          candidat = { regle: item.can, longueur: item.path.length };
        }
      }
      if (item.children) walk(item.children);
    }
  };
  walk(menus);
  return candidat;
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

  // 1. Correspondance EXACTE : une regle posee sur la route elle-meme prime toujours.
  const exactRule = findRuleForPath(menuData, path);
  if (exactRule) return ability.can(exactRule.action, exactRule.subject);

  const exactHorsMenu = REGLES_HORS_MENU[path];
  if (exactHorsMenu) return ability.can(exactHorsMenu.action, exactHorsMenu.subject);

  // 2. A defaut, heritage par SEGMENT — en mettant les deux sources en concurrence,
  //    le chemin declare le plus long gagnant (cf. `Candidat`).
  const parMenu = findRuleForPrefix(menuData, path);
  const parHorsMenu = trouverRegleHorsMenu(path);
  const meilleur = parHorsMenu.longueur > parMenu.longueur ? parHorsMenu : parMenu;
  if (meilleur.regle) return ability.can(meilleur.regle.action, meilleur.regle.subject);

  // Aucune regle : on refuse. Voir la note ci-dessus sur le sens de l'echec.
  return false;
};
