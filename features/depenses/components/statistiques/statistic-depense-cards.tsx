import { Boxes, CalendarClock, Coins, Wallet } from 'lucide-react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import StatisticDepenseCard from '@/components/depenses/stats/statistic-depense-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { IDepenseStatsParams } from '@/features/depenses/types/depense.type';
import EtatErreur from '@/components/commons/EtatErreur';

interface StatisticDepenseCardsProps {
  filters: {
    debut?: Date;
    fin?: Date;
    categoriesDepense?: string[] | null;
    statut?: string;
  };
}

/**
 * Les mesures de la période.
 *
 * <h3>LE PLAFOND DE 1 000 LIGNES QUI FAUSSAIT LE TOTAL</h3>
 * <p>Dès qu'un filtre de catégorie était posé, ce bandeau ABANDONNAIT les chiffres du
 * serveur et recalculait tout dans le navigateur : une seconde requête de `limit: 1000`,
 * un `filter()` sur les catégories, puis un `reduce()` sur les montants. Au-delà de
 * 1 000 dépenses sur la période, le nombre de lignes et le montant total étaient donc
 * SILENCIEUSEMENT faux, et rien ne le disait. Le commentaire qui justifiait ce détour
 * (« stats de l'API non filtrées par catégories pour le moment ») n'était plus vrai.</p>
 *
 * <p>Donc une seule requête, et le compte comme la somme sont calculés EN BASE sur
 * l'ensemble filtré, sans plafond. Au passage, la page cesse de tirer 1 000 lignes de
 * dépenses dont elle n'affichait aucune.</p>
 *
 * <h3>DEUX MESURES QUI N'EXISTAIENT NULLE PART</h3>
 * <p>Le montant moyen avec son minimum et son maximum, et le couple payé / reste à
 * payer. Le premier n'était calculé ni au front ni au back ; le second n'était servi que
 * par un endpoint à part filtrant `type_depense = 'FIXE'`, qui ne couvrait donc pas la
 * période, et dont le point d'appel côté écran n'était appelé par personne.</p>
 *
 * <p>La moyenne est faite ici plutôt qu'en base : ses deux termes viennent de la MÊME
 * requête, donc le quotient est exact et ne peut pas désigner un autre ensemble que le
 * total affiché à côté.</p>
 */
export default function StatisticDepenseCards({ filters }: StatisticDepenseCardsProps) {
  const currentSearchParams: IDepenseStatsParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense || undefined,
    statut: filters.statut || undefined,
  };

  const {
    data: statsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDepenseStatsQuery(currentSearchParams);

  // Sans donnee, les cartes affichent 0 categorie, 0 depense et 0 FCFA :
  // une periode sans depense et une API muette se ressemblent trait pour trait.
  if (isError) {
    return (
      <div className="w-full rounded-xl border border-separator bg-surface">
        <EtatErreur
          quoi="les statistiques de dépenses"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      </div>
    );
  }

  const nombre = statsData?.nombre_depenses ?? 0;
  const total = statsData?.montant_total ?? 0;
  const moyenne = nombre > 0 ? total / nombre : 0;
  const paye = statsData?.montant_paye ?? 0;
  const restant = statsData?.montant_restant ?? 0;
  const nbPayees = statsData?.nombre_payees ?? 0;
  const nbRestantes = statsData?.nombre_restantes ?? 0;

  return (
    <div className="w-full">
      {/* Grille partagee : les 15 bandeaux de l'ERP en utilisaient 13 differentes. */}
      <GrilleStats colonnes={3}>
        <StatisticDepenseCard isLoading={isLoading} title="Catégories" value={statsData?.nombre_categories} color="text-blue-600" bgColor="bg-blue-100" icon={<Boxes className="h-5 w-5" />} />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Nombre de dépense"
          value={nombre}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Dépenses"
          value={formatCFA(total)}
          color="text-green-600"
          bgColor="bg-green-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <CarteStat
          icone={Coins}
          isLoading={isLoading}
          libelle="Montant moyen"
          note={
            nombre > 0
              ? `min ${formatCFA(statsData?.montant_min ?? 0)} · max ${formatCFA(statsData?.montant_max ?? 0)}`
              : undefined
          }
          valeur={formatCFA(moyenne)}
        />
        <CarteStat
          icone={Wallet}
          isLoading={isLoading}
          libelle="Payé / Reste à payer"
          note={`${nbPayees} payée${nbPayees > 1 ? 's' : ''} · reste ${formatCFA(restant)} (${nbRestantes})`}
          valeur={formatCFA(paye)}
        />
      </GrilleStats>
    </div>
  );
}
