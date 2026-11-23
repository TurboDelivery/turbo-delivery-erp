import { COMPLEMENT_VIDE, type IProgramme } from '../types/programme.types';
import { carburantAffiche } from './carburant.utils';

/** Le champ de « Modifier le programme » qu'un manque désigne. */
export type CleManque = 'BASES' | 'SITE' | 'HORAIRES' | 'CARBURANT';

export interface IManque {
  cle: CleManque;
  libelle: string;
  /** Rouge : le programme ne peut pas partir. Orange : il part, mais sans carburant. */
  ton: 'danger' | 'warning';
}

/**
 * CE QUI MANQUE à un programme, nommé (RG-L01, RG-L03, RG-V04).
 *
 * <p>L'écran savait qu'un programme était « à compléter » et ne disait pas pourquoi : une
 * seule pastille existait, « Sans carburant ». Trois manques sur quatre demandaient donc
 * d'ouvrir la ligne pour apprendre ce qu'il fallait y saisir.</p>
 *
 * <p>⚠ C'est LA définition de « à compléter » : l'onglet, le groupe et le compteur de
 * l'action principale lisent `length > 0` de cette liste. Deux règles écrites à deux
 * endroits finiraient par ranger dans « À compléter » une ligne sans pastille.</p>
 *
 * <p>L'ordre est celui de la saisie : où le livreur travaille, quand, puis avec quel
 * carburant.</p>
 */
export function manquesProgramme(p: IProgramme): IManque[] {
  const manques: IManque[] = [];
  const c = p.complement ?? COMPLEMENT_VIDE;

  if (p.typeLivreur === 'SUPERVISEUR_LIVREUR') {
    // RG-V04 : il n'est rattaché à aucune base, mais doit en gérer au moins une.
    if ((c.basesGerees ?? []).length === 0) manques.push({ cle: 'BASES', libelle: 'Bases à renseigner', ton: 'danger' });
  } else if (!p.siteId) {
    manques.push({ cle: 'SITE', libelle: 'Site à renseigner', ton: 'danger' });
  }

  const actifs = (p.jours ?? []).filter((j) => j.actif);
  if (actifs.length === 0 || actifs.some((j) => !j.debut || !j.fin)) {
    manques.push({ cle: 'HORAIRES', libelle: 'Horaires à renseigner', ton: 'danger' });
  }

  if (carburantAffiche(p).montant === null) manques.push({ cle: 'CARBURANT', libelle: 'Sans carburant', ton: 'warning' });

  return manques;
}

/**
 * Les sites desservis d'une ligne, à la façon de la spec (§3.2) : deux puces au plus, puis
 * « +N » dont la liste complète se lit au survol.
 */
export function puceSitesDesservis(noms: string[], visibles = 2): { puces: string[]; reste: string[] } {
  return { puces: noms.slice(0, visibles), reste: noms.slice(visibles) };
}
