import { Skeleton } from '@heroui-v3/react';

/*
 * Squelette de la grille de paiement, rendu avec HeroUI V3.
 *
 * <p>Trois defauts corriges au passage.</p>
 *
 * <p>1. Le `Skeleton` venait de `components/ui`, ou il se peint en `bg-primary/10`.
 * `--primary` vaut `6 100% 50%` dans `:root` ET dans `.dark` : le meme rouge de marque
 * dans les deux themes. L'attente de la grille arrivait donc en aplats rouge pale, la
 * couleur que cet ecran reserve a l'action, alors qu'un squelette n'appelle aucune
 * action. Le `Skeleton` V3 se peint sur `--surface-tertiary`, neutre et defini dans les
 * deux themes, et anime un reflet au lieu d'un clignotement d'opacite.</p>
 *
 * <p>2. La silhouette ne correspondait pas a l'ecran qui la remplace : un seul trait de
 * titre sans sous-titre ni barre d'actions, et cinq tuiles egales en cinq colonnes la ou
 * la page rend trois compteurs puis trois totaux, sans le pied de soumission ni le
 * tableau a la bonne place. Le comptable voyait donc tout se redisposer au moment ou la
 * grille arrivait, et le bouton « Soumettre au DGA » se deplacait sous le curseur.</p>
 *
 * <p>3. L'attente n'etait annoncee a aucune technologie d'assistance : le lecteur d'ecran
 * restait muet entre la demande et l'arrivee de la grille. Le conteneur porte maintenant
 * `role="status"`.</p>
 */
export default function GrillePaiementSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement de la grille de paiement"
      className="flex flex-col gap-5 p-4 sm:p-6"
    >
      {/* Titre et sous-titre a gauche, barre d'actions a droite */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 self-start sm:self-auto">
          <Skeleton className="h-10 w-36 rounded-3xl" />
          <Skeleton className="h-10 w-28 rounded-3xl" />
          <Skeleton className="h-10 w-44 rounded-3xl" />
        </div>
      </div>

      {/* Bandeau du creneau verrouille */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Bandeau de stats : trois compteurs, puis trois totaux qui portent une note */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`compteur-${i}`} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`total-${i}`} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Tableau des lignes de paie */}
      <Skeleton className="h-64 w-full rounded-xl" />

      {/* Pied de soumission */}
      <Skeleton className="h-20 w-full rounded-3xl" />
    </div>
  );
}
