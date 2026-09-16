import { useInvestissementStatsSummaryQuery } from '@/features/investissement/queries/investissement-stats-summary.query';

/**
 * L'encours des investissements, sur TOUTE l'histoire.
 *
 * <h3>Le défaut corrigé, et ce qu'il coûtait</h3>
 * <p>Les quatre compteurs de cet écran lisaient la période choisie en haut de page, dont le
 * défaut est le MOIS EN COURS. Or « total investi », « total remboursé » et « montant
 * restant » ne sont pas des flux de période : ce sont des ÉTATS. Les filtrer sur un mois où
 * il ne s'est rien passé les met tous à zéro.</p>
 *
 * <p>Ce n'était pas une maladresse de présentation, c'était une affirmation fausse sur de
 * l'argent. Mesuré en production le 15/09/2026 : sur septembre, le service rend 0 partout,
 * et l'écran affichait « Montant restant : 0 FCFA ». Sur l'histoire complète, il rend
 * 6 200 000 investis, 0 remboursé, 6 200 000 restant dûs. Un lecteur pressé en concluait
 * que la société n'avait plus de dette. Le graphe placé juste en dessous montrait pourtant
 * les barres de février et mars, sans axe pour les chiffrer.</p>
 *
 * <h3>Pourquoi des bornes explicites et larges</h3>
 * <p>Sans bornes, le service rend zéro : vérifié. Il faut donc les poser. La borne basse est
 * celle que le tableau de bord Finance emploie déjà pour son cumul, l'année de démarrage de
 * l'application. La borne haute est la fin de l'année en cours, pour que les échéances déjà
 * enregistrées sur les mois à venir entrent dans le compte.</p>
 */

/** L'application démarre en 2024 : c'est la borne basse de tout cumul dans cet ERP. */
const DEBUT_HISTORIQUE = new Date(2024, 0, 1);

export function useInvestissementEncours() {
  const finDeLAnnee = new Date(new Date().getFullYear(), 11, 31);

  return useInvestissementStatsSummaryQuery({
    debut: DEBUT_HISTORIQUE,
    fin: finDeLAnnee,
  });
}
