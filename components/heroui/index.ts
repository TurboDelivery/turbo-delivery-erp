/**
 * Point de contact UNIQUE avec HeroUI.
 *
 * <p>268 fichiers importaient `@heroui/react` en direct, plus quatre qui passaient
 * par les sous-paquets `@heroui/table` et `@heroui/select`. Consequence concrete :
 * une correction appliquee « a la Table » n'atteignait PAS les ecrans qui
 * importaient le sous-paquet, et il n'existait aucun endroit ou poser une regle
 * transverse — la table de correspondance `color` x `variant`, un comportement de
 * formulaire homogene, un defaut de taille.</p>
 *
 * <p>Ce module ne change RIEN au rendu : il reexporte. Son interet est d'exister,
 * pour que la prochaine correction transverse se fasse ici plutot que 268 fois, et
 * pour que le jour ou HeroUI v3 devient envisageable, la surface a reprendre soit
 * ce fichier et non tout le depot.</p>
 *
 * <h3>Comment surcharger un composant</h3>
 * <p>Retirer le symbole de la reexportation globale ci-dessous ne se fait pas :
 * `export *` ne sait pas exclure. On procede a l'inverse — on declare la
 * surcharge APRES, une exportation nommee l'emporte sur celle du `export *` :</p>
 * <pre>
 *   import { Button as ButtonHeroUI, type ButtonProps } from '@heroui/react';
 *   export function Button(props: ButtonProps) {
 *     return &lt;ButtonHeroUI size="sm" {...props} /&gt;;
 *   }
 * </pre>
 *
 * <h3>Ce que ce fichier n'est pas</h3>
 * <p>Ce n'est pas une bibliotheque de composants maison. Tant qu'aucune regle
 * transverse n'est decidee, il reste une reexportation nue, et c'est bien ainsi :
 * une couche qui n'ajoute rien ne coute rien.</p>
 */
export * from '@heroui/react';
