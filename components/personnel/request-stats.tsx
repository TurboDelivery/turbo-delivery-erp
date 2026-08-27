'use client';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { useStatistiquesCongesQuery } from '@/features/conge/queries/conge.query';

/**
 * Bandeau de statistiques globales des conges.
 *
 * <p>Les six cartes etaient recopiees en Card/CardHeader/CardBody, chacune avec la
 * couleur de son chiffre ecrite en classe de palette brute (bleu, vert, gris, jaune,
 * rouge). Elles passent par `CarteStat` et ses tons : le mode sombre, masque
 * aujourd'hui mais destine a revenir, n'aura aucune retouche a demander ici.</p>
 *
 * <p>Le chargement s'affichait en « ... » a la place du chiffre, ce qui se lit comme une
 * valeur et non comme une attente : `isLoading` rend un squelette.</p>
 */
export function RequestStats() {
  const { data: statsData, isLoading: statsLoading } = useStatistiquesCongesQuery();

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-default-700 mb-4">Statistiques globales des congés</h3>
      <GrilleStats colonnes={3}>
        <CarteStat
          libelle="Actuellement en congé"
          valeur={statsData?.currentlyOnLeave || 0}
          note="Employés en congé"
          ton="primaire"
          isLoading={statsLoading}
        />
        <CarteStat
          libelle="Pris ce mois"
          valeur={statsData?.takenThisMonth || 0}
          note="Congés ce mois"
          ton="succes"
          isLoading={statsLoading}
        />
        <CarteStat
          libelle="Congés terminés"
          valeur={statsData?.completedLeaves || 0}
          note="Congés achevés"
          ton="neutre"
          isLoading={statsLoading}
        />
        <CarteStat
          libelle="Demandes en attente"
          valeur={statsData?.pendingRequests || 0}
          note="En attente de validation"
          ton="attention"
          isLoading={statsLoading}
        />
        <CarteStat
          libelle="Demandes approuvées"
          valeur={statsData?.approvedRequests || 0}
          note="Validées"
          ton="succes"
          isLoading={statsLoading}
        />
        <CarteStat
          libelle="Demandes rejetées"
          valeur={statsData?.rejectedRequests || 0}
          note="Refusées"
          ton="danger"
          isLoading={statsLoading}
        />
      </GrilleStats>
    </div>
  );
}
