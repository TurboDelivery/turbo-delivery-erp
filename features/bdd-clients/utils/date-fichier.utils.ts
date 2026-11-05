/**
 * Le lecteur de dates de fichier vit désormais dans
 * {@code lib/tableur/lecture-valeurs.ts}, partagé avec l'import de tickets. Réexporté
 * ici pour que tout ce qui l'importait déjà continue de fonctionner.
 */
export { compterDatesIllisibles, lireDateFichier } from '@/lib/tableur/lecture-valeurs';
export type { DateLue } from '@/lib/tableur/lecture-valeurs';
