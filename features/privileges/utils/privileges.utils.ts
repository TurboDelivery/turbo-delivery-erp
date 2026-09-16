// Le vocabulaire de l'ecran des privileges : ce qu'une ligne represente, ce que le code
// dit d'elle, et ce qu'aucune derogation n'a le droit de fermer.
// Pur, sans dependance React.

import menuData, { IMenuData } from '@/config/menu-data';
import { APP_ROLES, defineAbilityFor, type AppRole } from '@/lib/casl/ability';
import type { Derogation } from '@/src/privileges/privileges.action';

/** Une ligne de l'ecran : un groupe de menu, ou un ecran reel avec son chemin. */
export interface EntreeMenu {
  can?: IMenuData['can'];
  /** Chemin de la route. Absent sur un groupe, qui n'en a pas. */
  chemin?: string;
  /** Cle de rendu, unique meme quand deux groupes portent le meme intitule d'enfant. */
  cle: string;
  estGroupe: boolean;
  /** Intitule du groupe parent. Vide pour une entree de premier niveau. */
  groupe: string;
  titre: string;
}

/**
 * Le menu aplati sur un cran, groupes compris.
 *
 * <p>Deux niveaux au maximum, et c'est une contrainte du menu lui-meme : un groupe dans un
 * groupe perdrait ses petits-enfants ici SANS que rien ne le signale. La note en tete de
 * `config/menu-data.tsx` porte la meme mise en garde.</p>
 */
export function aplatirMenu(items: IMenuData[] = menuData): EntreeMenu[] {
  const lignes: EntreeMenu[] = [];
  for (const item of items) {
    if (item.children?.length) {
      lignes.push({
        can: item.can,
        chemin: item.path,
        cle: item.title,
        estGroupe: true,
        groupe: '',
        titre: item.title,
      });
      for (const enfant of item.children) {
        lignes.push({
          can: enfant.can,
          chemin: enfant.path,
          cle: `${item.title}>${enfant.title}`,
          estGroupe: false,
          groupe: item.title,
          titre: enfant.title,
        });
      }
    } else {
      lignes.push({
        can: item.can,
        chemin: item.path,
        cle: item.title,
        estGroupe: false,
        groupe: '',
        titre: item.title,
      });
    }
  }
  return lignes;
}

/** Les capacites de chaque role, calculees une fois : `defineAbilityFor` est pure. */
export const ABILITES: Record<string, ReturnType<typeof defineAbilityFor>> = Object.fromEntries(
  APP_ROLES.map((r) => [r, defineAbilityFor(r as AppRole)]),
);

/** Les roles, dans l'ordre alphabetique : celui de la constante ne suit aucune logique. */
export const ROLES_TRIES = [...APP_ROLES].sort((a, b) => a.localeCompare(b, 'fr'));

/** Ce que dit le CODE pour ce role sur cette entree. `null` : aucune regle declaree. */
export function regleDuCode(role: string, entree: EntreeMenu): boolean | null {
  if (!entree.can) return null;
  return ABILITES[role]?.can(entree.can.action, entree.can.subject) ?? false;
}

/** La cle d'une derogation. Un couple role + chemin, jamais deux lignes pour le meme. */
export function cleDerogation(role: string, chemin: string): string {
  return `${role.toUpperCase()}|${chemin}`;
}

/** L'etat des derogations, indexe par `cleDerogation`. */
export type EtatDerogations = Record<string, boolean>;

export function carteDepuis(derogations: Derogation[] | null | undefined): EtatDerogations {
  const carte: EtatDerogations = {};
  for (const d of derogations ?? []) {
    if (d?.role && d?.chemin) carte[cleDerogation(d.role, d.chemin)] = Boolean(d.autorise);
  }
  return carte;
}

export function listeDepuis(carte: EtatDerogations): Derogation[] {
  return Object.entries(carte).map(([cle, autorise]) => {
    const separateur = cle.indexOf('|');
    return { role: cle.slice(0, separateur), chemin: cle.slice(separateur + 1), autorise };
  });
}

/**
 * L'etat EFFECTIF : la derogation si elle existe, la regle du code sinon.
 *
 * <p>C'est ce que l'utilisateur verra reellement, et c'est donc ce que l'ecran doit
 * montrer. Afficher la regle du code a cote d'une derogation qui la contredit obligerait
 * a faire le calcul de tete.</p>
 */
export function etatEffectif(
  role: string,
  entree: EntreeMenu,
  derogations: EtatDerogations,
): boolean | null {
  if (entree.chemin) {
    const posee = derogations[cleDerogation(role, entree.chemin)];
    if (posee !== undefined) return posee;
  }
  return regleDuCode(role, entree);
}

/**
 * Les ecrans que la garde d'acces laisse passer AVANT de consulter la moindre derogation.
 *
 * <p>Ils sont dans `ALWAYS_ALLOWED_PATHS` de `utils/route-permission.ts`. Les fermer ici
 * ferait disparaitre leur entree du menu sans fermer la route : l'ecran mentirait sur son
 * propre effet. Ils sont donc montres verrouilles, avec leur raison.</p>
 */
const TOUJOURS_OUVERTS = ['/', '/analystics', '/settings/profile'];

/** Ce que le serveur refuse de fermer, et a qui. Meme liste que `PrivilegeMenuService`. */
const CHEMINS_INALIENABLES = ['/privileges', '/users'];
const ROLES_GARDIENS = ['ADMIN', 'DG'];

/**
 * La raison pour laquelle cette case ne se regle pas, ou `null` si elle se regle.
 *
 * <p>Le serveur refuse deja les deux derniers cas et le dit dans sa reponse. Les montrer
 * verrouilles ici evite de proposer un geste qui sera rejete : une commande qu'on peut
 * actionner et qui ne fait rien est pire qu'une commande visiblement fermee.</p>
 */
export function verrou(role: string, chemin: string | undefined, autorise: boolean | null): string | null {
  if (!chemin) return "Un groupe n'a pas de chemin : il suit ses écrans.";
  if (TOUJOURS_OUVERTS.includes(chemin)) {
    return (
      "Toujours accessible : la garde laisse passer cet écran quel que soit le rôle. " +
      "Le fermer ici ne ferait que le retirer du menu."
    );
  }
  if (
    CHEMINS_INALIENABLES.includes(chemin) &&
    ROLES_GARDIENS.includes(role.toUpperCase()) &&
    autorise !== false
  ) {
    return "Le serveur refuse de le fermer au DG : sans cet écran, plus personne ne pourrait rouvrir les accès.";
  }
  return null;
}
