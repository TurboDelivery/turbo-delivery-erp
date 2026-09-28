/**
 * Le collage depuis Excel, et les conversions qu'il impose.
 *
 * <p>Aucun écran de ce dépôt ne collait de tableau jusqu'ici : zéro `onPaste`. Tout ce
 * qui suit est donc écrit ici plutôt que dans un composant, parce que c'est de la logique
 * pure et que c'est le seul endroit du parcours qu'on puisse réellement mettre au banc.
 * Le reste de la grille se regarde ; ceci se prouve.</p>
 */

/**
 * Découpe le presse-papiers d'Excel en matrice de cellules.
 *
 * <p>Excel met du TSV dans le presse-papiers : tabulation entre les colonnes, saut de
 * ligne entre les lignes. Une cellule qui CONTIENT une tabulation ou un saut de ligne est
 * entourée de guillemets, et un guillemet interne est doublé. Ignorer cette règle
 * décalerait toutes les colonnes d'une ligne dès qu'un commentaire contient un retour à
 * la ligne, ce qui est exactement le genre de bug qu'on ne voit qu'en production.</p>
 *
 * <p>Les lignes entièrement vides sont écartées : Excel termine presque toujours son
 * presse-papiers par un saut de ligne, et une ligne vide de plus dans la grille à chaque
 * collage serait un agacement permanent.</p>
 */
export function analyserCollage(texte: string): string[][] {
  if (!texte) return [];

  const lignes: string[][] = [];
  let cellules: string[] = [];
  let cellule = '';
  let dansGuillemets = false;

  for (let i = 0; i < texte.length; i += 1) {
    const c = texte[i];

    if (dansGuillemets) {
      if (c === '"') {
        // Un guillemet doublé est un guillemet littéral.
        if (texte[i + 1] === '"') {
          cellule += '"';
          i += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        cellule += c;
      }
      continue;
    }

    if (c === '"' && cellule === '') {
      dansGuillemets = true;
    } else if (c === '\t') {
      cellules.push(cellule);
      cellule = '';
    } else if (c === '\n' || c === '\r') {
      // \r\n compte pour UN saut, sans quoi chaque ligne serait suivie d'une vide.
      if (c === '\r' && texte[i + 1] === '\n') i += 1;
      cellules.push(cellule);
      lignes.push(cellules);
      cellules = [];
      cellule = '';
    } else {
      cellule += c;
    }
  }

  if (cellule !== '' || cellules.length > 0) {
    cellules.push(cellule);
    lignes.push(cellules);
  }

  return lignes
    .map((l) => l.map((v) => v.trim()))
    .filter((l) => l.some((v) => v !== ''));
}

/**
 * Le montant tel qu'un tableur l'écrit, rendu en nombre.
 *
 * <p>⚠ Les espaces de groupement d'Excel ne sont pas des espaces ordinaires : c'est
 * U+00A0 (insécable) ou U+202F (fine insécable). Ce projet a déjà payé cette confusion,
 * sur les PDF, où `toLocaleString('fr-FR')` imprimait « 20/000 ». Les retirer par
 * `replace(/ /g,'')` n'en enlèverait aucun.</p>
 *
 * <p>La virgule décimale française est acceptée. Un texte qui ne contient aucun chiffre
 * rend `null` et non zéro : zéro est un montant, l'absence n'en est pas un.</p>
 */
export function analyserMontant(texte: string | null | undefined): number | null {
  if (texte === null || texte === undefined) return null;

  const sansEspaces = String(texte).replace(/[\s\u00A0\u202F\u2009]/g, '');

  // Le signe se lit AVANT d'etre retire. Un montant negatif n'est pas un ticket, c'est
  // une faute de frappe ; le depouiller de son signe rendrait 500 la ou l'agent a tape
  // -500, ce qui est pire que de refuser.
  if (/^-/.test(sansEspaces)) return null;

  const chiffresEtSeparateurs = sansEspaces.replace(/[^\d,.]/g, '');
  if (chiffresEtSeparateurs === '' || !/\d/.test(chiffresEtSeparateurs)) return null;

  /*
   * LE POINT EST UN SEPARATEUR DE MILLIERS, PAS UNE DECIMALE.
   *
   * Un tableur francais ecrit « 12.500 » pour douze mille cinq cents. Le lire comme un
   * decimal enregistrait 12,5 : un ticket divise par mille, sans que rien ne le signale,
   * et un panier moyen faux pour toujours. Seule la VIRGULE est decimale ici.
   */
  const sansMilliers = chiffresEtSeparateurs.replace(/\./g, '');

  // Deux virgules ne sont pas un nombre : on rend null plutot qu'un resultat invente.
  if ((sansMilliers.match(/,/g) ?? []).length > 1) return null;

  const valeur = Number(sansMilliers.replace(',', '.'));
  // Un montant negatif n'est pas un ticket, c'est une faute de frappe.
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : null;
}

/** Les colonnes de la grille, dans l'ordre où Excel les collera. */
export const COLONNES_GRILLE = [
  'nom',
  'contact',
  'prenom',
  'zoneSaisie',
  'numCheck',
  'montant',
  'articles',
] as const;

export type ColonneGrille = (typeof COLONNES_GRILLE)[number];

/** Une ligne de la grille, avant tout contrôle. Tout est texte : c'est une saisie. */
export type LigneGrille = Record<ColonneGrille, string>;

export function ligneVide(): LigneGrille {
  return {
    nom: '',
    contact: '',
    prenom: '',
    zoneSaisie: '',
    numCheck: '',
    montant: '',
    articles: '',
  };
}

/**
 * Applique un collage à la grille, à partir de la cellule où l'on se trouve.
 *
 * <p>Le collage ÉTEND la grille si besoin : coller trente lignes sur une grille qui en
 * compte dix en crée vingt. Tronquer silencieusement serait le pire des comportements,
 * l'opérateur croirait avoir tout collé.</p>
 *
 * <p>Il ne dépasse pas {@code maximum} lignes, parce que le serveur refuse le lot entier
 * au-delà : mieux vaut s'arrêter et le dire que faire saisir puis tout perdre.</p>
 */
export function appliquerCollage(
  grille: LigneGrille[],
  texte: string,
  depart: { ligne: number; colonne: number },
  maximum: number,
): { grille: LigneGrille[]; tronque: number } {
  const matrice = analyserCollage(texte);
  if (matrice.length === 0) return { grille, tronque: 0 };

  const resultat = grille.map((l) => ({ ...l }));
  let tronque = 0;

  matrice.forEach((cellules, decalageLigne) => {
    const index = depart.ligne + decalageLigne;
    if (index >= maximum) {
      tronque += 1;
      return;
    }
    while (resultat.length <= index) resultat.push(ligneVide());

    cellules.forEach((valeur, decalageColonne) => {
      const colonne = COLONNES_GRILLE[depart.colonne + decalageColonne];
      if (colonne) resultat[index][colonne] = valeur;
    });
  });

  return { grille: resultat, tronque };
}
