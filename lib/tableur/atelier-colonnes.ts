/**
 * L'atelier de colonnes : recomposer un tableur avant de l'importer.
 *
 * <h3>Pourquoi ce module ne vit plus dans un module métier</h3>
 * <p>Il est né dans l'import de la base clients, et il n'a jamais rien su des contacts.
 * L'import de TICKETS a le même besoin, au mot près. Le laisser là où il était aurait
 * obligé le module des tickets à importer le module des clients pour recomposer des
 * colonnes : une dépendance qui ne dit rien de vrai, et que personne ne comprendrait en
 * la relisant. Il est donc remonté ici, et {@code features/bdd-clients/utils/import.utils.ts}
 * le réexporte pour que tout ce qui l'importait déjà continue de marcher.</p>
 *
 * <h3>Ce qu'il résout</h3>
 * <p>Un fichier de caisse ne sort jamais aux colonnes qu'on attend. Le nom et le prénom
 * sont dans une seule case, ou l'inverse ; le montant traîne une devise ; le numéro porte
 * un indicatif. Sans moyen de recomposer les colonnes, il faut rouvrir le fichier dans un
 * tableur, le corriger à la main et le réexporter — et c'est là que les erreurs entrent.</p>
 *
 * <h3>Les colonnes portent un IDENTIFIANT, jamais une position</h3>
 * <p>C'est la décision qui tient tout le reste. Une transformation qui désignerait la
 * « colonne 2 » casserait dès qu'on supprime la colonne 1 : la suite de transformations
 * deviendrait fausse en silence, et la prévisualisation montrerait autre chose que ce
 * qu'on a demandé. Chaque colonne reçoit donc un identifiant stable au chargement, et
 * chaque ligne est un dictionnaire, pas un tableau.</p>
 *
 * <h3>La table source n'est jamais modifiée</h3>
 * <p>Les transformations forment une LISTE qu'on rejoue depuis la source à chaque rendu.
 * Défaire, c'est retirer un élément de la liste ; il n'y a donc pas d'historique à tenir
 * ni d'état à réconcilier, et la prévisualisation est toujours exactement ce que
 * l'enregistrement produira.</p>
 */

/** Une colonne de la table, avec un identifiant qui ne bouge pas. */
export interface IColonneImport {
  id: string;
  nom: string;
  /** Vrai pour les colonnes nées d'une transformation : l'écran les distingue. */
  calculee?: boolean;
}

/** Une table : des colonnes, et des lignes indexées par identifiant de colonne. */
export interface ITableImport {
  colonnes: IColonneImport[];
  lignes: Record<string, string>[];
}

/** Les nettoyages possibles sur une colonne. */
export type NettoyageImport =
  | 'espaces'
  | 'majuscules'
  | 'minuscules'
  | 'capitales'
  | 'chiffres'
  | 'sansAccents';

/** Ce qu'une condition compare. */
export type ComparaisonImport = 'contient' | 'egal' | 'vide' | 'nonVide' | 'commencePar';

export const LIBELLES_COMPARAISON: Record<ComparaisonImport, string> = {
  commencePar: 'commence par',
  contient: 'contient',
  egal: 'vaut exactement',
  nonVide: "n'est pas vide",
  vide: 'est vide',
};

/** Une transformation, telle que l'écran la pose. */
export type ITransformation =
  | { type: 'fusionner'; sources: string[]; separateur: string; nom: string; id: string }
  | {
      type: 'filtrer';
      source: string;
      comparaison: ComparaisonImport;
      valeur: string;
      /** Vrai : on GARDE les lignes qui correspondent. Faux : on les retire. */
      garder: boolean;
    }
  | {
      type: 'diviser';
      source: string;
      separateur: string;
      nomGauche: string;
      nomDroite: string;
      idGauche: string;
      idDroite: string;
    }
  | { type: 'nettoyer'; source: string; nettoyage: NettoyageImport }
  | { type: 'supprimer'; source: string }
  | { type: 'renommer'; source: string; nom: string };

/** Les libellés des nettoyages, pour l'écran et pour les messages. */
export const LIBELLES_NETTOYAGE: Record<NettoyageImport, string> = {
  capitales: 'Première lettre en capitale',
  chiffres: 'Ne garder que les chiffres',
  espaces: 'Retirer les espaces en trop',
  majuscules: 'Tout en majuscules',
  minuscules: 'Tout en minuscules',
  sansAccents: 'Retirer les accents',
};

/** Applique un nettoyage à une valeur. */
export function nettoyer(valeur: string, nettoyage: NettoyageImport): string {
  switch (nettoyage) {
    case 'espaces':
      // Toutes les espaces, y compris insécable et fine : un fichier de caisse en est
      // plein, et elles sont invisibles à la relecture.
      return valeur.replace(/[\s   ]+/g, ' ').trim();
    case 'majuscules':
      return valeur.toUpperCase();
    case 'minuscules':
      return valeur.toLowerCase();
    case 'capitales':
      // ⚠ Pas de `\p{L}` ni de drapeau `u` : la cible de compilation de ce dépôt est
      // es5, et TypeScript refuse ces échappements. La classe explicite couvre les
      // lettres accentuées du français, qui sont ce qu'on rencontre sur les tickets.
      return valeur
        .toLowerCase()
        .replace(/(^|[\s'’-])([a-zà-öø-ÿ])/g, (_, avant: string, lettre: string) =>
          `${avant}${lettre.toUpperCase()}`,
        );
    case 'chiffres':
      return valeur.replace(/\D+/g, '');
    case 'sansAccents':
      // La plage U+0300–U+036F est celle des diacritiques combinants, ce que produit
      // exactement la décomposition NFD.
      return valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    default:
      return valeur;
  }
}

/**
 * Une valeur satisfait-elle une condition ?
 *
 * <p>La comparaison ignore la casse et les espaces de bord : un fichier de caisse écrit
 * « Annulé », « ANNULE » et « annulé  » pour la même chose, et demander à l'opérateur de
 * deviner laquelle il a sous les yeux serait lui demander de relire mille lignes.</p>
 */
export function comparer(
  valeur: string,
  comparaison: ComparaisonImport,
  attendue: string,
): boolean {
  const v = valeur.trim().toLowerCase();
  const a = attendue.trim().toLowerCase();
  switch (comparaison) {
    case 'vide':
      return v === '';
    case 'nonVide':
      return v !== '';
    case 'egal':
      return v === a;
    case 'commencePar':
      return a !== '' && v.startsWith(a);
    case 'contient':
      return a !== '' && v.includes(a);
    default:
      return false;
  }
}

/** Un identifiant de colonne, stable et lisible dans les messages d'erreur. */
export function nouvelIdColonne(prefixe = 'c'): string {
  return `${prefixe}${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Construit la table à partir d'une grille brute, en-tête comprise.
 *
 * <p>⚠ Une colonne sans en-tête reçoit un nom, elle n'est pas écartée : une colonne
 * anonyme peut très bien être celle qui porte les numéros, et la faire disparaître au
 * chargement serait une perte silencieuse. Un en-tête en double est suffixé, sinon deux
 * colonnes porteraient le même nom à l'écran et on ne saurait plus laquelle on rattache.</p>
 */
export function construireTable(grille: string[][]): ITableImport {
  if (grille.length === 0) {
    return { colonnes: [], lignes: [] };
  }
  const entetes = grille[0] ?? [];
  const largeur = grille.reduce((max, l) => Math.max(max, l.length), entetes.length);

  const vus = new Map<string, number>();
  const colonnes: IColonneImport[] = [];
  for (let i = 0; i < largeur; i++) {
    const brut = (entetes[i] ?? '').trim();
    let nom = brut === '' ? `Colonne ${i + 1}` : brut;
    const deja = vus.get(nom) ?? 0;
    vus.set(nom, deja + 1);
    if (deja > 0) {
      nom = `${nom} (${deja + 1})`;
    }
    colonnes.push({ id: nouvelIdColonne(), nom });
  }

  const lignes = grille.slice(1).map((brute) => {
    const ligne: Record<string, string> = {};
    colonnes.forEach((c, i) => {
      ligne[c.id] = (brute[i] ?? '').trim();
    });
    return ligne;
  });

  return { colonnes, lignes };
}

/**
 * Rejoue toutes les transformations depuis la table source.
 *
 * <p>⚠ Une transformation qui désigne une colonne disparue est IGNORÉE, pas fatale :
 * supprimer une colonne après l'avoir fusionnée ne doit pas casser tout l'écran. Elle
 * reste dans la liste, et l'écran la montre comme sans effet — la retirer à sa place
 * ferait disparaître un geste que l'opérateur a posé.</p>
 */
export function appliquer(
  source: ITableImport,
  transformations: ITransformation[],
): ITableImport {
  let colonnes = [...source.colonnes];
  let lignes = source.lignes.map((l) => ({ ...l }));

  const existe = (id: string) => colonnes.some((c) => c.id === id);

  for (const t of transformations) {
    switch (t.type) {
      case 'fusionner': {
        const presentes = t.sources.filter(existe);
        if (presentes.length < 2) break;
        colonnes = [...colonnes, { calculee: true, id: t.id, nom: t.nom }];
        lignes = lignes.map((l) => ({
          ...l,
          [t.id]: presentes
            .map((id) => l[id] ?? '')
            .filter((v) => v !== '')
            .join(t.separateur),
        }));
        break;
      }
      case 'diviser': {
        if (!existe(t.source)) break;
        colonnes = [
          ...colonnes,
          { calculee: true, id: t.idGauche, nom: t.nomGauche },
          { calculee: true, id: t.idDroite, nom: t.nomDroite },
        ];
        lignes = lignes.map((l) => {
          const valeur = l[t.source] ?? '';
          // Séparateur vide : on ne coupe pas, sinon chaque caractère deviendrait
          // une part et la colonne de droite recevrait tout sauf la première lettre.
          const position = t.separateur === '' ? -1 : valeur.indexOf(t.separateur);
          return {
            ...l,
            [t.idDroite]:
              position < 0 ? '' : valeur.slice(position + t.separateur.length).trim(),
            [t.idGauche]: position < 0 ? valeur : valeur.slice(0, position).trim(),
          };
        });
        break;
      }
      case 'nettoyer': {
        if (!existe(t.source)) break;
        lignes = lignes.map((l) => ({
          ...l,
          [t.source]: nettoyer(l[t.source] ?? '', t.nettoyage),
        }));
        break;
      }
      case 'renommer': {
        colonnes = colonnes.map((c) => (c.id === t.source ? { ...c, nom: t.nom } : c));
        break;
      }
      case 'supprimer': {
        colonnes = colonnes.filter((c) => c.id !== t.source);
        break;
      }
      case 'filtrer': {
        if (!existe(t.source)) break;
        lignes = lignes.filter((l) => {
          const correspond = comparer(l[t.source] ?? '', t.comparaison, t.valeur);
          return t.garder ? correspond : !correspond;
        });
        break;
      }
      default:
        break;
    }
  }

  return { colonnes, lignes };
}
