/**
 * La règle de mot de passe de l'ERP, écrite une fois.
 *
 * <h3>Pourquoi ce fichier existe</h3>
 * <p>La règle vivait à trois endroits et disait trois choses. Le serveur
 * (`Utility.passwordValidator`) n'acceptait que trois caractères spéciaux, `@`, `#` et
 * `_`, tout en affichant « un caractère spécial ». L'écran « Définir un mot de passe »
 * énonçait la règle complète et ne vérifiait que la longueur. Le changement obligatoire,
 * lui, ne vérifiait rien : on découvrait le refus après l'aller-retour, par un message
 * qui décrivait exactement ce qu'on croyait avoir fait.</p>
 *
 * <p>Le serveur accepte désormais tout caractère qui n'est ni une lettre ni un chiffre.
 * Ce fichier dit la MÊME chose, et sert aux deux écrans.</p>
 *
 * <p>⚠ Ceci ne remplace pas la validation du serveur, qui reste le juge. Ça lui évite
 * d'être le seul endroit où la règle s'apprend.</p>
 */

export const LONGUEUR_MINIMALE_MOT_DE_PASSE = 8;

/** Une exigence de la règle, et comment savoir si elle est tenue. */
export interface ExigenceMotDePasse {
  libelle: string;
  tenue: (valeur: string) => boolean;
}

export const EXIGENCES_MOT_DE_PASSE: ExigenceMotDePasse[] = [
  {
    libelle: `${LONGUEUR_MINIMALE_MOT_DE_PASSE} caractères au minimum`,
    tenue: (v) => v.length >= LONGUEUR_MINIMALE_MOT_DE_PASSE,
  },
  { libelle: 'une majuscule', tenue: (v) => /[A-Z]/.test(v) },
  { libelle: 'une minuscule', tenue: (v) => /[a-z]/.test(v) },
  { libelle: 'un chiffre', tenue: (v) => /\d/.test(v) },
  {
    // Le miroir exact du serveur : tout ce qui n'est ni lettre non accentuée ni chiffre.
    // Nommer des exemples est le point : « un caractère spécial » ne dit pas lesquels, et
    // c'est précisément ce qui faisait recommencer les gens.
    libelle: 'un caractère spécial (! @ # $ % & * - _ . …)',
    tenue: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

/** Le mot de passe respecte-t-il toute la règle ? */
export function motDePasseValide(valeur: string): boolean {
  return EXIGENCES_MOT_DE_PASSE.every((exigence) => exigence.tenue(valeur));
}

/** Ce qui manque encore, dans l'ordre de la règle. Vide quand tout est tenu. */
export function manquesDuMotDePasse(valeur: string): string[] {
  return EXIGENCES_MOT_DE_PASSE.filter((e) => !e.tenue(valeur)).map((e) => e.libelle);
}
