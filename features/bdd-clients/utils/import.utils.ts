/**
 * Le moteur de transformation de l'import de contacts.
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

/** Les champs de destination : ce que la base clients sait recevoir. */
export const CHAMPS_IMPORT = [
  'contact',
  'nom',
  'prenom',
  'numCheck',
  'numCommande',
  'montant',
  'dateCommande',
  'zoneSaisie',
] as const;

export type ChampImport = (typeof CHAMPS_IMPORT)[number];

export const LIBELLES_CHAMP_IMPORT: Record<ChampImport, string> = {
  contact: 'Numéro de téléphone',
  dateCommande: 'Date de la commande',
  montant: 'Montant',
  nom: 'Nom',
  numCheck: 'Numéro de check',
  numCommande: 'Numéro de commande',
  prenom: 'Prénoms',
  zoneSaisie: 'Quartier',
};

/** Le rattachement : quel champ prend quelle colonne. */
export type IRattachement = Partial<Record<ChampImport, string>>;

/**
 * Propose un rattachement à partir des noms de colonnes.
 *
 * <p>Il PROPOSE : l'opérateur voit et corrige. Un rattachement imposé sur une
 * ressemblance de nom mettrait un « Total TTC » dans « montant » sans que personne ne
 * l'ait décidé, et une colonne mal rattachée entre en base sans laisser de trace.</p>
 */
export function proposerRattachement(colonnes: IColonneImport[]): IRattachement {
  const motifs: [ChampImport, RegExp][] = [
    ['contact', /t[eé]l|phone|contact|num[eé]ro|mobile|cell/i],
    ['numCheck', /check|ticket|re[cç]u/i],
    ['numCommande', /commande|order|facture/i],
    ['montant', /montant|total|prix|ttc|somme|amount/i],
    ['dateCommande', /date|jour/i],
    ['prenom', /pr[eé]nom|first/i],
    ['nom', /^nom|nom\b|client|last|name/i],
    ['zoneSaisie', /quartier|zone|commune|adresse|secteur/i],
  ];

  const propose: IRattachement = {};
  const pris = new Set<string>();
  for (const [champ, motif] of motifs) {
    const trouvee = colonnes.find((c) => !pris.has(c.id) && motif.test(c.nom));
    if (trouvee) {
      propose[champ] = trouvee.id;
      pris.add(trouvee.id);
    }
  }
  return propose;
}

/** Une ligne prête pour la grille de saisie, telle que le serveur l'attend. */
export interface ILigneImportee {
  contact: string;
  nom: string;
  prenom: string;
  numCheck: string;
  numCommande: string;
  montant: string;
  dateCommande: string;
  zoneSaisie: string;
}

/**
 * Transforme la table rattachée en lignes de saisie.
 *
 * <p>⚠ Une ligne dont le CONTACT est vide est écartée ici, et le compte des écartées est
 * rendu. Un fichier de caisse se termine presque toujours par une ligne de total, et une
 * ligne sans numéro n'est pas un client : la laisser passer ferait un refus incompréhensible
 * au contrôle, sur une ligne que l'opérateur n'a pas saisie.</p>
 */
export function versLignes(
  table: ITableImport,
  rattachement: IRattachement,
): { lignes: ILigneImportee[]; ecartees: number } {
  const lire = (ligne: Record<string, string>, champ: ChampImport): string => {
    const colonne = rattachement[champ];
    return colonne ? (ligne[colonne] ?? '').trim() : '';
  };

  const lignes: ILigneImportee[] = [];
  let ecartees = 0;

  for (const brute of table.lignes) {
    const contact = lire(brute, 'contact');
    if (contact === '') {
      // Une ligne entièrement vide ne compte pas comme écartée : c'est du remplissage
      // de fin de fichier, pas une ligne qu'on refuse.
      const quelqueChose = Object.values(brute).some((v) => v.trim() !== '');
      if (quelqueChose) ecartees++;
      continue;
    }
    lignes.push({
      contact,
      dateCommande: lire(brute, 'dateCommande'),
      montant: lire(brute, 'montant'),
      nom: lire(brute, 'nom'),
      numCheck: lire(brute, 'numCheck'),
      numCommande: lire(brute, 'numCommande'),
      prenom: lire(brute, 'prenom'),
      zoneSaisie: lire(brute, 'zoneSaisie'),
    });
  }

  return { ecartees, lignes };
}
