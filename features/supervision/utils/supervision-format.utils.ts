// Formatage partagé par les quatre onglets de Supervision & Audit.
// Pur, sans dépendance React — réutilisé tel quel par l'export CSV.

import { IAuditAction, ISessionErp } from '../types';

/** `31/07/2026 09:42` — horodatage complet, pour les journaux. */
export function formatInstant(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** `09:42:07` — à la seconde, pour les flux d'aujourd'hui. */
export function formatHeure(iso: string | null | undefined, avecSecondes = true): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      ...(avecSecondes ? { second: '2-digit' } : {}),
    });
  } catch {
    return iso;
  }
}

/** `12/01/2026` — date seule (compte créé le…). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** `3 h 07 min` / `47 min` / `12 s` — durée lisible à partir de secondes. */
export function formatDuree(secondes: number | null | undefined): string {
  if (secondes === null || secondes === undefined || Number.isNaN(secondes)) return '—';
  const s = Math.max(0, Math.floor(secondes));
  if (s < 60) return `${s} s`;
  const heures = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (heures === 0) return `${minutes} min`;
  return `${heures} h ${String(minutes).padStart(2, '0')} min`;
}

/**
 * Durée de session recalculée localement à partir de `loginAt`, pour qu'elle
 * s'incrémente entre deux rafraîchissements réseau. `maintenant` est fourni par
 * l'horloge de l'écran ; à défaut de `loginAt` on retombe sur la valeur serveur.
 */
export function dureeSessionVivante(session: ISessionErp, maintenant: number): number {
  if (!session.loginAt) return session.dureeSessionS ?? 0;
  const debut = new Date(session.loginAt).getTime();
  if (Number.isNaN(debut)) return session.dureeSessionS ?? 0;
  return Math.max(0, Math.floor((maintenant - debut) / 1000));
}

/**
 * Page en cours en libellé fonctionnel — jamais une URL : le backend ne publie
 * que le couple module / écran (`Finances › Clôture de caisse`).
 */
export function libellePage(session: ISessionErp): string {
  // `module` est un identifiant réservé côté Next (no-assign-module-variable).
  const moduleCourant = session.moduleCourant?.trim();
  const ecran = session.ecranCourant?.trim();
  if (moduleCourant && ecran) return `${moduleCourant} › ${ecran}`;
  return moduleCourant || ecran || 'Écran non identifié';
}

/** Objet concerné : libellé lisible, avec repli sur le type d'entité. */
export function libelleObjet(action: IAuditAction): string {
  return action.entiteLibelle?.trim() || action.entiteType?.trim() || action.ecran?.trim() || '—';
}

/** Référence de l'objet : identifiant court, lisible dans une colonne. */
export function referenceObjet(action: IAuditAction): string {
  const id = action.entiteId?.trim();
  if (!id) return '';
  // Les identifiants sont des UUID : on n'affiche que le premier segment, le
  // reste est du bruit dans un tableau dense (l'UUID complet reste en info-bulle).
  return id.length > 12 ? id.slice(0, 8) : id;
}

/** Valeur d'un champ d'audit rendue en texte (les VM renvoient du JSON libre). */
export function formatValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === '') return '∅';
  if (typeof valeur === 'boolean') return valeur ? 'oui' : 'non';
  if (typeof valeur === 'object') {
    try {
      return JSON.stringify(valeur);
    } catch {
      return String(valeur);
    }
  }
  return String(valeur);
}

/** Nom de champ technique → libellé lisible (`montantTotal` → `Montant total`). */
export function libelleChamp(champ: string): string {
  const espace = champ
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return espace.charAt(0).toUpperCase() + espace.slice(1);
}

export interface IChangement {
  champ: string;
  avant: string;
  apres: string;
}

/**
 * Différentiel d'une action : union des champs présents avant/après.
 * Le backend ne stocke que les champs réellement modifiés, la liste reste donc
 * courte — pas de troncature ici, c'est l'affichage qui décide quoi montrer.
 */
export function changements(action: IAuditAction): IChangement[] {
  const avant = action.valeursAvant ?? {};
  const apres = action.valeursApres ?? {};
  const champs = Array.from(new Set([...Object.keys(avant), ...Object.keys(apres)]));
  return champs.map((champ) => ({
    champ,
    avant: formatValeur(avant[champ]),
    apres: formatValeur(apres[champ]),
  }));
}

/** Détail d'une action en une ligne de texte — utilisé par l'export CSV. */
export function detailTexte(action: IAuditAction): string {
  const lignes = changements(action).map((c) => `${libelleChamp(c.champ)} : ${c.avant} → ${c.apres}`);
  if (lignes.length > 0) return lignes.join(' | ');
  if (!action.succes && action.erreur) return `Échec : ${action.erreur}`;
  return '';
}

/** Utilisateur affiché sur une ligne de connexion (échec sur compte inconnu inclus). */
export function utilisateurConnexion(utilisateur: string | null, identifiant: string | null): string {
  if (utilisateur?.trim()) return utilisateur.trim();
  if (identifiant?.trim()) return `${identifiant.trim()} (compte inconnu)`;
  return '—';
}

/** Initiales pour l'avatar de la colonne Utilisateur. */
export function initiales(nom: string | null | undefined): string {
  if (!nom) return '—';
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((mot) => mot[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
