/**
 * LE DOUBLON DE CATÉGORIE DE DÉPENSE, DIT AVANT L'ALLER-RETOUR.
 *
 * <h3>Pourquoi ces règles sont ici</h3>
 * <p>Rien n'empêchait de créer deux fois la même catégorie : le schéma de validation ne
 * vérifiait qu'un `min(1)`, le serveur enregistrait sans lire ce qui existe, et la base
 * ne porte aucune contrainte. Le serveur refuse désormais, en 409 avec un message
 * lisible. Ces règles-ci ne le remplacent pas, elles le disent plus tôt : l'écran porte
 * déjà la liste des catégories, autant ne pas faire un aller-retour pour apprendre ce
 * qu'on sait.</p>
 *
 * <h3>⚠ DEUX NORMALISATIONS, ET ELLES NE SONT PAS INTERCHANGEABLES</h3>
 * <p>`cleExacte` doit reproduire EXACTEMENT ce que fait le serveur, soit
 * `LOWER(TRIM(nom_categorie))` dans `chercherParNomNormalise`. Rien de plus : si l'écran
 * normalisait plus fort que le serveur, il refuserait un nom que le serveur accepte, et
 * l'opérateur se verrait interdire une création possible sans pouvoir comprendre
 * pourquoi. C'est le défaut classique de la règle recopiée dans l'écran.</p>
 *
 * <p>`cleApprochee`, elle, PEUT être plus large, parce qu'elle ne refuse rien : elle
 * suggère. Un faux rapprochement coûte une phrase à lire, pas une création bloquée.</p>
 */

/** Une catégorie, réduite à ce dont ces règles ont besoin. */
export interface CategorieComparable {
  id?: string;
  nomCategorie?: string | null;
}

/**
 * La clé que le SERVEUR compare : minuscules et espaces de bord retirés, point final.
 * Toute addition ici désaccorde l'écran du serveur.
 */
export function cleExacte(nom: string | null | undefined): string {
  /*
   * ⚠ PAS `trim()`, et c'est tout le sujet de cette fonction.
   *
   * <p>`String.prototype.trim()` retire TOUTE la classe d'espaces Unicode : insecable
   * (U+00A0), fine insecable (U+202F), demi-cadratin... La `TRIM()` de Postgres, elle,
   * ne retire que l'ESPACE ordinaire. Un nom colle depuis un tableur, « Loyer\u00A0 »,
   * serait donc reduit a « loyer » par l'ecran — qui le refuserait comme doublon — et
   * laisse tel quel par le serveur, qui l'aurait accepte. L'operateur se verrait interdire
   * une creation possible sans qu'aucun message ne puisse l'expliquer.</p>
   *
   * <p>On ne retire donc que ce que Postgres retire. Un nom a espace insecable reste
   * distinct des deux cotes : c'est discutable comme regle metier, mais c'est la MEME
   * regle des deux cotes, et c'est la seule chose que cette fonction doit garantir.</p>
   */
  return (nom ?? '').replace(/^ +| +$/g, '').toLowerCase();
}

/**
 * La clé du rapprochement : accents retirés, ponctuation retirée, espaces réduits à un,
 * et le pluriel de fin de mot ignoré. « Réparations motos » rejoint « reparation moto ».
 */
export function cleApprochee(nom: string | null | undefined): string {
  return (nom ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((mot) => (mot.length > 3 && mot.endsWith('s') ? mot.slice(0, -1) : mot))
    .join(' ');
}

/**
 * La catégorie qui porte DÉJÀ ce nom, au sens du serveur. C'est un refus.
 *
 * @param exclureId la catégorie en cours de renommage, qui ne se fait pas doublon
 *                  d'elle-même.
 */
export function trouverDoublonExact(
  nom: string | null | undefined,
  categories: CategorieComparable[],
  exclureId?: string,
): CategorieComparable | null {
  const cle = cleExacte(nom);
  if (!cle) return null;
  return (
    categories.find((c) => c.id !== exclureId && cleExacte(c.nomCategorie) === cle) ?? null
  );
}

/**
 * La catégorie qui ressemble à ce nom sans être le même. C'est un avertissement.
 *
 * <p>Rend `null` quand un doublon exact existe : c'est alors le refus qui parle, et deux
 * messages sur le même champ se contredisent à l'oeil.</p>
 */
export function trouverSimilaire(
  nom: string | null | undefined,
  categories: CategorieComparable[],
  exclureId?: string,
): CategorieComparable | null {
  if (trouverDoublonExact(nom, categories, exclureId)) return null;
  const cle = cleApprochee(nom);
  if (!cle) return null;
  return (
    categories.find((c) => c.id !== exclureId && cleApprochee(c.nomCategorie) === cle) ?? null
  );
}
