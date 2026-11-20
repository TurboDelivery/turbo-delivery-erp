import { Boxes, CalendarClock } from 'lucide-react';
import { GrilleStats } from '@/components/commons/CarteStat';
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
  };
}

/**
 * Les trois mesures de la période : catégories touchées, nombre de lignes, montant total.
 *
 * <h3>LE PLAFOND DE 1 000 LIGNES QUI FAUSSAIT LE TOTAL</h3>
 * <p>Dès qu'un filtre de catégorie était posé, ce bandeau ABANDONNAIT les chiffres du
 * serveur et recalculait tout dans le navigateur : une seconde requête de `limit: 1000`,
 * un `filter()` sur les catégories, puis un `reduce()` sur les montants. Au-delà de
 * 1 000 dépenses sur la période, le nombre de lignes et le montant total étaient donc
 * SILENCIEUSEMENT faux, et rien ne le disait. Le commentaire qui justifiait ce détour
 * (« stats de l'API non filtrées par catégories pour le moment ») n'était plus vrai :
 * `/finance/depenses/stats` accepte `categorieIds` et bascule sur
 * `findDepensesStatsWithCategories`, qui ajoute `AND d.categorie_depense IN (:ids)` au
 * `COUNT` et au `SUM`.</p>
 *
 * <p>Donc une seule requête, et le compte comme la somme sont calculés EN BASE sur
 * l'ensemble filtré, sans plafond. Au passage, la page cesse de tirer 1 000 lignes de
 * dépenses dont elle n'affichait aucune.</p>
 */
export default function StatisticDepenseCards({ filters }: StatisticDepenseCardsProps) {
  const currentSearchParams: IDepenseStatsParams = {
    debut: filters.debut,
    fin: filters.fin,
    categoriesDepense: filters.categoriesDepense || undefined,
  };

  const {
    data: statsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDepenseStatsQuery(currentSearchParams);

  // Sans donnee, les trois cartes affichent 0 categorie, 0 depense et 0 FCFA :
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

  return (
    <div className="w-full">
      {/* Grille partagee : les 15 bandeaux de l'ERP en utilisaient 13 differentes. */}
      <GrilleStats colonnes={3}>
        <StatisticDepenseCard isLoading={isLoading} title="Catégories" value={statsData?.nombre_categories} color="text-blue-600" bgColor="bg-blue-100" icon={<Boxes className="h-5 w-5" />} />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Nombre de dépense"
          value={statsData?.nombre_depenses}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatisticDepenseCard
          isLoading={isLoading}
          title="Dépenses"
          value={formatCFA(statsData?.montant_total || 0)}
          color="text-green-600"
          bgColor="bg-green-100"
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </GrilleStats>
    </div>
  );
}
