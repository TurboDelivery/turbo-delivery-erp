import RevenusHeader from '@/components/components-finance/revenus/header';
import InvestissementMonthlyChart from '@/features/revenus/components/cumul/investissement/analyse/repartition/investissement-monthly-chart';
import InvestissementList from '@/features/revenus/components/cumul/investissement/invest-list/invest-list';
import SyntheseInvestissements from '@/features/revenus/components/cumul/investissement/stats/synthese-investissements';

/**
 * Les apports internes et leur remboursement.
 *
 * <h3>Le défaut que cet écran portait</h3>
 * <p>Ses quatre compteurs lisaient une période, dont le défaut était le mois en cours. Le
 * 15/09/2026, l'écran affichait « Montant restant : 0 FCFA » alors que 6 200 000 FCFA
 * étaient dus et qu'aucun franc n'avait été remboursé. Les barres du graphe, juste en
 * dessous, portaient ces montants sans axe pour les chiffrer : l'écran se contredisait
 * lui-même, et rien ne signalait que les deux blocs ne regardaient pas la même période.</p>
 *
 * <p>Une dette est un ÉTAT, pas un flux : elle ne s'efface pas parce qu'on regarde un autre
 * mois. La synthèse lit donc toute l'histoire et n'a plus de filtre de période. Il reste deux
 * commandes de temps au lieu de trois, chacune collée au bloc qu'elle pilote : l'année sur le
 * graphe, la période sur la liste.</p>
 *
 * <h3>L'ordre des blocs</h3>
 * <p>Ce que l'on doit, puis quand on le doit, puis l'historique. La question de celui qui
 * ouvre cet écran est « combien reste-t-il à rembourser, et à quelle échéance » : elle se
 * répond dans les deux premiers blocs, sans faire défiler.</p>
 */
export default function RevenueInvestissementPage() {
  return (
    <div className="flex flex-col gap-5">
      <RevenusHeader
        sousTitre="Apports reçus, remboursements effectués et échéances à venir."
        title="Investissements internes"
      />

      <SyntheseInvestissements />

      <InvestissementList />

      <InvestissementMonthlyChart />
    </div>
  );
}
