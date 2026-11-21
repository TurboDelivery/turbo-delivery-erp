'use client';

import { Button } from '@heroui-v3/react';
import { Download } from 'lucide-react';
import React from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { ChampListe } from '@/components/commons/champs-formulaire';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';
import { useDepensesListQuery } from '@/features/depenses/queries/depense-list.query';
import { useDepenseStatsQuery } from '@/features/depenses/queries/depense-stats.query';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * LE GRAND LIVRE DES DÉPENSES, en lecture seule.
 *
 * <h3>Pourquoi cet onglet existe</h3>
 * <p>Cet écran s'intitule « Dépenses, Décaissement & Rentabilité », mais ce qu'il listait
 * jusqu'ici sont des CHARGES : l'engagement, pas la sortie. Une charge ne devient une
 * dépense qu'au décaissement, où {@code payerCharge} et {@code decaisser} insèrent la
 * ligne dans {@code depenses}. Un lecteur qui cherchait les dépenses croyait donc les
 * avoir sous les yeux.</p>
 *
 * <p>Les 678 lignes du grand livre n'étaient consultables que sur deux écrans absents du
 * menu et de tout lien, atteignables seulement par une URL tapée à la main. Ils sont
 * supprimés ; leur lecture revient ici, où l'on est déjà quand on pense dépenses, à côté
 * de l'engagement qui les a produites.</p>
 *
 * <h3>⚠ LECTURE SEULE, ET C'EST LE POINT</h3>
 * <p>L'ancien écran portait un formulaire de saisie libre qui écrivait directement dans le
 * grand livre par {@code POST /api/finance/depenses} : sans justificatif, sans visa DGA,
 * sans accord DG. Il contournait exactement la cascade que cet écran impose. Cette porte
 * ne revient pas. Une dépense naît d'un décaissement, et de rien d'autre.</p>
 *
 * <p>La période et les catégories viennent de l'écran hôte : ce sont les mêmes filtres que
 * les cartes et les graphiques au-dessus, donc les chiffres se comparent. Le statut, lui,
 * est propre à cet onglet, parce qu'il ne veut rien dire pour une charge.</p>
 */

const STATUTS = [
  { label: 'Tous les statuts', value: 'TOUS' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'À décaisser', value: 'A_DECAISSER' },
  { label: 'Décaissé', value: 'DECAISSE' },
  { label: 'Payé', value: 'PAID' },
] as const;

const LIBELLE_STATUT: Record<string, string> = {
  A_DECAISSER: 'À décaisser',
  DECAISSE: 'Décaissé',
  PAID: 'Payé',
  PENDING: 'En attente',
};

const PAGE = 15;

const dateCourte = (v?: string) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function GrandLivreTab({
  categories,
  debut,
  fin,
}: {
  categories: string[];
  debut: Date;
  fin: Date;
}) {
  const [statut, setStatut] = React.useState('');
  const [page, setPage] = React.useState(0);

  // Changer un filtre remet a la premiere page : la pagination ne survit pas au filtre.
  React.useEffect(() => {
    setPage(0);
  }, [statut, debut, fin, categories.length]);

  const params = {
    categoriesDepense: categories.length > 0 ? categories : undefined,
    debut,
    fin,
    limit: PAGE,
    page,
    statut: statut || undefined,
  };

  const { data, isError, isFetching, isLoading, refetch } = useDepensesListQuery(params);
  const { data: stats } = useDepenseStatsQuery({
    categoriesDepense: categories.length > 0 ? categories : undefined,
    debut,
    fin,
    statut: statut || undefined,
  });
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  const lignes = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const pages = data?.totalPages ?? 0;

  const colonnes: readonly ColonneResponsive<IDepense>[] = [
    {
      cle: 'designation',
      identite: true,
      libelle: 'Désignation',
      rendu: (d) => (
        <div className="flex flex-col">
          <span className="font-medium">{d.libelle || d.description || '-'}</span>
          {d.libelle && d.description && (
            <span className="text-xs text-muted">{d.description}</span>
          )}
        </div>
      ),
    },
    {
      cle: 'categorie',
      libelle: 'Catégorie',
      rendu: (d) => <span className="text-sm">{d.categorie?.nomCategorie ?? '-'}</span>,
    },
    {
      cle: 'type',
      libelle: 'Type',
      rendu: (d) => (
        <span className="text-sm text-muted">
          {d.typeDepense === 'FIXE' ? 'Charge fixe' : d.typeDepense === 'VARIABLE' ? 'Variable' : '-'}
        </span>
      ),
    },
    {
      cle: 'date',
      libelle: 'Comptabilisée le',
      rendu: (d) => <span className="text-sm">{dateCourte(d.dateDepense)}</span>,
    },
    {
      cle: 'statut',
      libelle: 'Statut',
      rendu: (d) => (
        <span className="text-sm">{LIBELLE_STATUT[d.statut] ?? d.statut ?? '-'}</span>
      ),
    },
    {
      cle: 'montant',
      libelle: 'Montant',
      nombre: true,
      rendu: (d) => <span className="tabular-nums">{formatCFA(d.montant)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/*
        * ⚠ `items-end` : le sélecteur porte un libellé au-dessus de son champ, le bouton
        * n'en a pas. Centrés, le bouton flotterait au-dessus de la ligne du champ.
        */}
      <div className="flex flex-wrap items-end justify-end gap-3">
        <div className="w-full sm:w-[220px]">
          <ChampListe
            label="Statut"
            onChange={(v) => setStatut(v === 'TOUS' ? '' : v)}
            options={STATUTS}
            placeholder="Tous les statuts"
            valeur={statut || 'TOUS'}
          />
        </div>
        <Button
          isPending={isLoadingDepenseExport}
          onPress={() =>
            exportDepensesToExcel({
              categoriesDepense: categories.length > 0 ? categories : undefined,
              debut,
              fin,
              statut: statut || undefined,
            })
          }
          variant="outline"
        >
          <Download aria-hidden="true" className="size-4" />
          Exporter (Excel)
        </Button>
      </div>

      {/* Les mesures portent les MEMES filtres que la liste, statut compris. */}
      <GrilleStats colonnes={3}>
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Montant total"
          note="Sur la sélection"
          valeur={formatCFA(stats?.montant_total ?? 0)}
        />
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Payé"
          note={`reste ${formatCFA(stats?.montant_restant ?? 0)} (${stats?.nombre_restantes ?? 0})`}
          valeur={formatCFA(stats?.montant_paye ?? 0)}
        />
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Lignes"
          note={
            (stats?.nombre_depenses ?? 0) > 0
              ? `min ${formatCFA(stats?.montant_min ?? 0)} · max ${formatCFA(stats?.montant_max ?? 0)}`
              : undefined
          }
          valeur={stats?.nombre_depenses ?? 0}
        />
      </GrilleStats>

      <TableauResponsive
        cleLigne={(d) => d.id}
        colonnes={colonnes}
        enChargement={isLoading}
        enCoursDeRelance={isFetching}
        erreur={isError}
        libelle="Grand livre des dépenses"
        lignes={lignes}
        onReessayer={() => refetch()}
        quoi="le grand livre des dépenses"
        vide="Aucune dépense sur cette sélection. Une dépense naît du décaissement d'une charge."
      />

      {/*
        * Le pied reste MUET pendant le chargement et en cas d'echec : « 0 ligne · 0 FCFA »
        * pose a cote d'un message d'erreur se lit comme une periode vide.
        */}
      {!isLoading && !isError && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {total} {total > 1 ? 'lignes' : 'ligne'} au total
            {pages > 1 ? ` · page ${page + 1} sur ${pages}` : ''}
          </p>
          {pages > 1 && (
            <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={pages} />
          )}
        </div>
      )}
    </div>
  );
}
