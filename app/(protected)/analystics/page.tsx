import Pilotage from '@/components/dashboard/pilotage';

/**
 * Tableau de bord.
 *
 * <p>Rendait `DatabaseCards` puis `FinanceDashboard` : cinq cartes de compteurs, une
 * carte de chiffre d'affaires, cinq tuiles pastel, un bandeau, quatre tuiles de cumul,
 * puis un graphique a cinq courbes avec ses cinq cartes de resume. Vingt-deux nombres
 * qu'aucune hierarchie ne departageait, et dont aucun ne disait quoi faire.</p>
 *
 * <p>Les composants precedents restent dans le depot : le retour en arriere tient en un
 * import.</p>
 */
export default function Page() {
    return <Pilotage />;
}
