'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useCAExport } from '@/features/finance-dashboard/hooks/use-ca-export';
import { useGlobalStats } from '@/features/finance-dashboard/queries/global-stats.query';
import DateFilterInput from '@/components/finance/date-filter-input';
import { DateRange } from 'react-day-picker';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Button, Card, Skeleton } from '@heroui-v3/react';
import Link from 'next/link';
import LigneMontant from './ligne-montant';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { useFinanceResumeQuery } from '@/features/finance-dashboard/queries/finance-resume.query';
import EtatErreur from '@/components/commons/EtatErreur';

export default function DashboardFinanceStatistics() {
  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  });

  const debut = dateRange?.from;
  const fin = dateRange?.to;
  const queryParams = useMemo(() => ({ debut, fin }), [debut, fin]);

  // Utiliser React Query pour les données globales
  const {
    data: globalStats,
    isLoading,
    isFetching: isFetchingGlobal,
    isError: isErrorGlobal,
    refetch: refetchGlobal,
  } = useGlobalStats(queryParams);

  const {
    data: depenseSummary,
    isFetching: isFetchingSummary,
    isError: isErrorSummary,
    refetch: refetchSummary,
  } = useDepenseSummaryQuery(queryParams);
  const {
    data: resume,
    isFetching: isFetchingResume,
    isError: isErrorResume,
    refetch: refetchResume,
  } = useFinanceResumeQuery(queryParams);

  // Utiliser les données de l'API globale pour les statistiques
  const chiffreAffaires = globalStats?.chiffreAffaire ?? 0;
  const fraisLivraison = globalStats?.fraisLivraison ?? 0;
  const commissions = globalStats?.commission ?? 0;
  const totalRecurrentes = depenseSummary?.totalRecurrentes ?? 0;
  const totalNonRecurrentes = depenseSummary?.totalNonRecurrentes ?? 0;
  const sommeDepenses = totalNonRecurrentes + totalRecurrentes;
  const marge = chiffreAffaires - sommeDepenses;
  const isDeficit = marge < 0;
  const margeStateLabel = isDeficit ? 'Déficit' : 'Excédent';
  const margeStateClassName = isDeficit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  const formattedDepenses = formatCFA(sommeDepenses);
  const formattedMarge = formatCFA(marge);
  const formattedRecurrentes = formatCFA(totalRecurrentes);
  const formattedNonRecurrentes = formatCFA(totalNonRecurrentes);
  //   const investissement = globalStats?.investissement || 0;

  // Liens de drill-down : on ouvre la page concernée avec la période pré-appliquée.
  const toIso = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');
  const periodeQS = debut && fin ? `?debut=${toIso(debut)}&fin=${toIso(fin)}` : '';
  const facturesPeriodeQS =
    debut && fin ? `?tab=factures&fPeriodeDebut=${toIso(debut)}&fPeriodeFin=${toIso(fin)}` : '';
  // Cumul : plage « tout l'historique » (l'app démarre en 2024 → aujourd'hui).
  const ALL_TIME_DEBUT = '2024-01-01';
  const allTimeFin = format(new Date(), 'yyyy-MM-dd');
  // La page /finance/charges a été supprimée : les dépenses sont désormais pilotées
  // depuis le tableau de bord Finance unifié (/finance/dashboard).
  const depensesCumuleHref = '/finance/dashboard';
  const encoursCumuleHref = `/finance/recouvrement?tab=factures&fPeriodeDebut=${ALL_TIME_DEBUT}&fPeriodeFin=${allTimeFin}`;

  // Titre dynamique pour la carte CA
  const caTitle = dateRange ? 'CA de la Période' : 'CA du Mois';

  // Hook pour l'exportation Excel du CA
  const { exportCAToExcel, isLoadingCAExport } = useCAExport();

  // Fonction pour télécharger les détails du CA en Excel
  const handleDownloadDetails = useCallback(() => {
    if (!debut || !fin || debut > fin) {
      return;
    }

    // Appeler l'exportation Excel
    exportCAToExcel({
      debut,
      fin,
      selectedMonth: null,
      selectedYear: debut?.getFullYear() || new Date().getFullYear(),
    });
  }, [debut, fin, exportCAToExcel]);

  const dateFilters = useMemo(
    () => ({
      debut,
      fin,
    }),
    [debut, fin],
  );

  // Trois requetes alimentent les indicateurs. Sur echec, chacune retombe sur `?? 0`
  // et l'ecran affiche « 0 FCFA » : un chiffre faux se lit comme un chiffre vrai.
  // Les indicateurs de periode croisent les trois (la marge = CA - depenses).
  const isErrorIndicateurs = isErrorGlobal || isErrorSummary || isErrorResume;
  const isFetchingIndicateurs = isFetchingGlobal || isFetchingSummary || isFetchingResume;
  const reessayerIndicateurs = useCallback(() => {
    refetchGlobal();
    refetchSummary();
    refetchResume();
  }, [refetchGlobal, refetchSummary, refetchResume]);

  return (
    <div className="w-full px-4 py-6">
      {/* En-tete : le titre porte la periode, plus besoin de la repeter dans chaque carte. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Finances</h2>
          <p className="text-sm text-muted">
            {debut && fin ? `Du ${format(debut, 'dd/MM/yyyy')} au ${format(fin, 'dd/MM/yyyy')}` : 'Mois en cours'}
          </p>
        </div>
        <DateFilterInput filters={dateFilters} handleDateChange={setDateRange} />
      </div>

      {/*
        * DEUX COLONNES ASYMETRIQUES, et c'est le coeur de la refonte.
        *
        * <p>L'ecran presentait ces quatorze montants en ONZE TUILES colorees — sept teintes
        * de fond sans rapport avec ce que le chiffre raconte — plus un panneau vert, deux
        * bandeaux rouge et orange, et quatre tuiles indigo. Quatre langages visuels sur une
        * page, tous de meme poids : rien ne disait quel chiffre comptait, et les montants,
        * non alignes, ne se comparaient pas.</p>
        *
        * <p>C'est un ETAT FINANCIER. Il se lit donc comme tel : la periode a gauche, en
        * large, avec son chiffre d'affaires en tete et ses composantes DECALEES dessous ;
        * le cumul a droite, en retrait, parce qu'on le consulte moins souvent. Une seule
        * carte, des montants alignes en chasse tabulaire, et la couleur reduite a une seule
        * fonction : dire le sens du flux.</p>
        */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        {/* ── Colonne 1 : la periode ────────────────────────────────── */}
        <Card>
          <Card.Header>
            <Card.Title className="text-sm font-medium text-muted">{caTitle}</Card.Title>
          </Card.Header>

          <Card.Content className="flex flex-col">
            {isErrorGlobal ? (
              <EtatErreur quoi="le chiffre d'affaires" onReessayer={() => refetchGlobal()} enCours={isFetchingGlobal} />
            ) : (
              <>
                <p className="text-4xl font-semibold tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-10 w-52 rounded-lg" /> : formatCFA(chiffreAffaires)}
                </p>

                {/* Un mois qui vient de commencer affiche « 0 FCFA » partout. Sans cette
                    mention, cela se lit comme un effondrement. */}
                {!isLoading && chiffreAffaires === 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Aucune course facturée sur cette période. Ce zéro n&apos;est pas une baisse.
                  </p>
                )}

                <div className="mt-4 flex flex-col">
                  <LigneMontant libelle="Frais de livraison" valeur={formatCFA(fraisLivraison)} sens="entree" detail />
                  <LigneMontant libelle="Commissions" valeur={formatCFA(commissions)} sens="entree" detail />
                  <LigneMontant
                    libelle="Commission fixe"
                    valeur={formatCFA(globalStats?.commissionFixe ?? 0)}
                    detail
                    note="incluse dans les commissions"
                  />
                  <LigneMontant
                    libelle="Commission au pourcentage"
                    valeur={formatCFA(globalStats?.commissionPourcentage ?? 0)}
                    detail
                  />
                </div>
              </>
            )}

            {isErrorIndicateurs ? (
              <div className="mt-4">
                <EtatErreur
                  quoi="les indicateurs de la période"
                  onReessayer={reessayerIndicateurs}
                  enCours={isFetchingIndicateurs}
                />
              </div>
            ) : (
              <>
                <LigneMontant
                  libelle="Dépenses"
                  valeur={formattedDepenses}
                  sens="sortie"
                  href="/finance/dashboard"
                  separateur
                />
                <LigneMontant libelle="Charges fixes" valeur={formattedRecurrentes} detail />
                <LigneMontant libelle="Charges variables" valeur={formattedNonRecurrentes} detail />

                <LigneMontant
                  libelle={isDeficit ? 'Déficit de la période' : 'Marge de la période'}
                  valeur={formattedMarge}
                  sens={isDeficit ? 'sortie' : 'entree'}
                  href="/finance/analyse-rentabilite"
                  separateur
                />

                <LigneMontant
                  libelle="Revenus encaissés"
                  valeur={formatCFA(resume?.totalRevenus ?? 0)}
                  sens="entree"
                  href={`/finance/recouvrement${periodeQS}`}
                  separateur
                />
                <LigneMontant
                  libelle="Encours à recouvrer"
                  valeur={formatCFA(resume?.totalFacturesEnCours ?? 0)}
                  sens="alerte"
                  href={`/finance/recouvrement${facturesPeriodeQS}`}
                />
                <LigneMontant
                  libelle="Investissements"
                  valeur={formatCFA(resume?.totalInvestissements ?? 0)}
                  href={`/finance/revenue/investissement${periodeQS}`}
                />
              </>
            )}
          </Card.Content>

          <Card.Footer className="flex flex-wrap items-center gap-3">
            <Button isPending={isLoadingCAExport} size="sm" variant="secondary" onPress={handleDownloadDetails}>
              Télécharger les détails
            </Button>
            <Link className="text-xs text-muted transition-colors hover:text-accent" href="/finance/revenue">
              Voir le détail du chiffre d&apos;affaires
            </Link>
          </Card.Footer>
        </Card>

        {/* ── Colonne 2 : depuis l'origine ──────────────────────────── */}
        <Card variant="secondary">
          <Card.Header>
            <Card.Title className="text-sm font-medium text-muted">Depuis l&apos;origine</Card.Title>
            <Card.Description className="text-xs">Cumul de toute l&apos;activité</Card.Description>
          </Card.Header>

          <Card.Content className="flex flex-col">
            {isErrorResume ? (
              <EtatErreur quoi="les cumuls financiers" onReessayer={() => refetchResume()} enCours={isFetchingResume} />
            ) : (
              <>
                <LigneMontant
                  libelle="Chiffre d'affaires"
                  valeur={formatCFA(resume?.chiffreAffaireCumule ?? 0)}
                  sens="entree"
                  href="/finance/revenue"
                />
                <LigneMontant
                  libelle="Dépenses"
                  valeur={formatCFA(resume?.totalDepensesCumule ?? 0)}
                  sens="sortie"
                  href={depensesCumuleHref}
                />
                <LigneMontant
                  libelle="Marge"
                  valeur={formatCFA(resume?.margeCumule ?? 0)}
                  sens={(resume?.margeCumule ?? 0) < 0 ? 'sortie' : 'entree'}
                  href="/finance/analyse-rentabilite"
                  separateur
                />
                <LigneMontant
                  libelle="Encours à recouvrer"
                  valeur={formatCFA(resume?.totalFacturesEnCoursCumule ?? 0)}
                  sens="alerte"
                  href={encoursCumuleHref}
                />
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
