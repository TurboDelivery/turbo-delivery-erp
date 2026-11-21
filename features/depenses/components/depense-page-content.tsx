'use client';

import StatisticDepenseCards from '@/features/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/features/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { Button } from '@heroui-v3/react';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';
import { ChampListe } from '@/components/commons/champs-formulaire';

/**
 * Les statuts d'une dépense, dans l'ordre du parcours.
 *
 * <p>La valeur « TOUS » plutôt qu'une chaîne vide : la liste de la v3 traite une clé vide
 * comme une absence de sélection, l'option ne pourrait donc pas être choisie pour revenir
 * en arrière. Elle est traduite en chaîne vide juste avant d'atteindre le filtre.</p>
 */
const STATUTS = [
  { label: 'Tous les statuts', value: 'TOUS' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'À décaisser', value: 'A_DECAISSER' },
  { label: 'Décaissé', value: 'DECAISSE' },
  { label: 'Payé', value: 'PAID' },
] as const;

export default function DepensePageContent() {
  const { filters, handleDateChange, handleCategoriesChange, handleStatutChange } =
    useDepenseDashboardFilters();
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  const handleExport = () => {
    exportDepensesToExcel({
      debut: filters.debut,
      fin: filters.fin,
      categoriesDepense: filters.categoriesDepense,
      // Le fichier doit respecter TOUS les filtres de l'écran, pas seulement la période
      // et les catégories : sinon son nom annonce une sélection que son contenu ignore.
      statut: filters.statut || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 ">
      <DepenseHeader />
      {/*
        * ⚠ `items-end` ET NON `items-center`. Les trois filtres portent un libelle
        * au-dessus de leur champ, le bouton n'en a pas : centres, ils ne s'alignent sur
        * rien, et le bouton flotte au-dessus de la ligne des champs. Alignes par le BAS,
        * tout se pose sur la meme ligne de base, celle des champs qu'on lit.
        *
        * Et le bouton passe APRES les filtres : exporter agit sur le resultat de ce qui
        * precede, le lire en premier demandait de deviner sur quoi il porte. Les filtres
        * se lisent de gauche a droite, l'action vient apres.
        *
        * `flex-wrap` parce que la fenetre de travail fait environ 1000 px : quatre
        * controles sur une ligne s'y ecrasent, et un champ ecrase ne se lit plus.
        */}
      <div className="flex flex-wrap items-end justify-end gap-3">
        <CategoriesSelectFilter selectedCategories={filters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
        <div className="w-full sm:w-[220px]">
          <ChampListe
            label="Statut"
            onChange={(v) => handleStatutChange(v === 'TOUS' ? '' : v)}
            options={STATUTS}
            placeholder="Tous les statuts"
            valeur={filters.statut || 'TOUS'}
          />
        </div>
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
        {/* Le bouton d'export etait peint en SUCCES. Exporter n'est pas une reussite,
            c'est une action ordinaire : le vert y etait reserve pour rien. Et le libelle
            changeait pendant l'attente, alors que le bouton v3 montre deja son propre
            indicateur — on lisait « Exportation... » a cote d'un cercle qui tourne. */}
        <Button isPending={isLoadingDepenseExport} onPress={handleExport} variant="outline">
          Exporter (Excel)
        </Button>
      </div>
      <StatisticDepenseCards filters={filters} />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}

