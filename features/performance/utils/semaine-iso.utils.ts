/**
 * Le nom CANONIQUE d'une semaine : son numéro ISO, et l'année de son JEUDI.
 *
 * <p>C'est la convention du projet depuis le 08/09/2026, et ce n'est pas un détail de
 * présentation : c'est la clé que le backend reçoit en paramètre et avec laquelle il
 * retrouve les emplois du temps. Se tromper d'année sur une semaine à cheval sur deux
 * années rendrait la liste vide, sans rien signaler.</p>
 *
 * <p>L'année du jeudi est la règle ISO : la semaine 1 est celle qui contient le premier
 * jeudi de janvier. Une semaine qui commence le 29 décembre appartient donc à l'année
 * suivante, et une qui commence le 30 décembre 2024 est la semaine 1 de 2025.</p>
 */
export interface SemaineIso {
  annee: number;
  semaine: number;
}

const MS_PAR_JOUR = 86_400_000;

/**
 * Le numéro ISO et l'année d'une date quelconque.
 *
 * <p>On se déplace d'abord sur le JEUDI de la semaine, puis on compte les semaines depuis
 * le 1er janvier de l'année de ce jeudi. Tout passe par UTC pour qu'un changement d'heure
 * ne décale pas le calcul d'un jour.</p>
 */
export function semaineIsoDeDate(date: Date): SemaineIso {
  const jeudi = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // getUTCDay() rend 0 pour dimanche ; la norme ISO le compte comme 7.
  const jourIso = jeudi.getUTCDay() || 7;
  jeudi.setUTCDate(jeudi.getUTCDate() + 4 - jourIso);

  const annee = jeudi.getUTCFullYear();
  const premierJanvier = Date.UTC(annee, 0, 1);
  const semaine = Math.ceil(((jeudi.getTime() - premierJanvier) / MS_PAR_JOUR + 1) / 7);

  return { annee, semaine };
}

/**
 * Le nom canonique d'une semaine désignée par son lundi, ou `null` si la valeur reçue n'en
 * est pas un.
 *
 * <h3>Pourquoi elle peut rendre `null`</h3>
 * <p>Elle lit un paramètre d'URL, donc une valeur que N'IMPORTE QUI peut écrire. Elle
 * construisait un `Date` sans le valider : sur une valeur non conforme la date était
 * invalide, `getUTCDay()` rendait `NaN`, et le calcul rendait `{annee: NaN, semaine: NaN}`.
 * `NaN` n'est pas `null`, donc il franchissait la garde de l'action, partait dans l'URL
 * d'appel, et le backend répondait <b>400</b> : « Paramètre 'annee' invalide : NaN ». La
 * page entière tombait sur l'écran d'erreur au lieu de se replier sur la semaine en cours.</p>
 *
 * <p>⚠ Le cas n'est pas théorique : `?semaine=2026-9-7` — un lundi écrit sans zéro, ce que
 * l'on tape naturellement à la main — suffit à le déclencher.</p>
 */
export function semaineIsoDepuisLundi(lundi: string): SemaineIso | null {
  // Format strict : quatre chiffres, deux, deux. `new Date` accepte bien trop de choses.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lundi)) return null;

  const date = new Date(`${lundi}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const iso = semaineIsoDeDate(date);
  if (!Number.isFinite(iso.annee) || !Number.isFinite(iso.semaine)) return null;

  return iso;
}

/** Le lundi de la semaine en cours, au format `AAAA-MM-JJ`. */
export function lundiDeLaSemaineEnCours(): string {
  const aujourdhui = new Date();
  const jourIso = aujourdhui.getDay() || 7;
  const lundi = new Date(aujourdhui);
  lundi.setDate(aujourdhui.getDate() - (jourIso - 1));

  const mois = String(lundi.getMonth() + 1).padStart(2, '0');
  const jour = String(lundi.getDate()).padStart(2, '0');
  return `${lundi.getFullYear()}-${mois}-${jour}`;
}
