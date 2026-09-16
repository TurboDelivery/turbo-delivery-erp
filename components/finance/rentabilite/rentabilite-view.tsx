'use client';

import {
  Alert,
  Button,
  Calendar,
  DateField,
  DatePicker,
  Label,
  ProgressBar,
  Spinner,
} from '@heroui-v3/react';
import {
  CalendarDate,
  getLocalTimeZone,
  today as aujourdhui,
  type DateValue,
} from '@internationalized/date';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import CarteStat from '@/components/commons/CarteStat';
import { EtatFinancier } from '@/features/finance-dashboard/components/etat/etat-financier';
import { useRentabiliteQuery } from '@/features/rentabilite';
import {
  construireCompteDeResultat,
  memeJourMoisPrecedent,
  resultatParJour,
  tauxMarge,
} from '@/features/rentabilite/utils/comparaison.utils';
import { formatMontant } from '@/utils/format.utils';

const MOINS = '−';

const dateDuJour = () => new Date().toISOString().slice(0, 10);

function enDateCalendaire(iso: string): CalendarDate | null {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
}

/** « 15/09/2026 ». Le service rend de l'ISO, qui ne se lit pas à l'œil. */
function enDateLisible(iso: string): string {
  const [a, m, j] = (iso ?? '').split('-');
  return a && m && j ? `${j}/${m}/${a}` : iso;
}

/** « Septembre 2026 ». */
function enMoisLisible(iso: string): string {
  const d = enDateCalendaire(iso);
  if (!d) return '';
  const libelle = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(d.year, d.month - 1, 1),
  );
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

/** Un montant signé, avec le vrai signe moins et non le trait d'union d'Intl. */
function montantSigne(v: number): string {
  const texte = formatMontant(Math.abs(v));
  if (v < 0) return `${MOINS} ${texte}`;
  if (v > 0) return `+ ${texte}`;
  return texte;
}

function pourcentSigne(v: number): string {
  const texte = `${Math.abs(v).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  if (v < 0) return `${MOINS}${texte}`;
  if (v > 0) return `+${texte}`;
  return texte;
}

/**
 * La rentabilité du mois, lue comme un compte de résultat.
 *
 * <h3>Ce que l'écran disait, et ce qu'il ne disait pas</h3>
 * <p>Il affichait trois tuiles et une carte de tête. Sur les seize champs rendus par le
 * service, dix étaient montrés, dont quatre réécrits deux ou trois fois, et SIX étaient
 * jetés : la décomposition du chiffre d'affaires, c'est-à-dire la seule chose qui explique
 * d'où vient le résultat. La décomposition des dépenses, elle, était enfermée dans un
 * popover derrière une icône. Les trois quarts de la page restaient vides.</p>
 *
 * <p>Il manquait surtout le fait le plus lourd de la page. Mesuré le 15/09/2026 : au même
 * jour du mois précédent, avec le MÊME socle de charges fixes au prorata (4 043 000 au franc
 * près), le résultat valait +1 562 944 et vaut aujourd'hui {MOINS}131 022. Le chiffre
 * d'affaires a reculé de 26 %, les dépenses de 14 %, et l'encaissement de 92 %. Rien de tout
 * cela n'était à l'écran.</p>
 *
 * <h3>Pourquoi un compte de résultat et non des tuiles</h3>
 * <p>C'est la forme naturelle de cette donnée, et le projet a déjà tranché la question sur le
 * tableau de bord Finance : des tuiles empêchent de voir la soustraction. Ici le lecteur
 * additionne les frais de livraison et la commission, retombe sur le chiffre d'affaires,
 * soustrait les dépenses, retombe sur le résultat. La colonne de droite porte les mêmes
 * grandeurs au même jour du mois précédent : c'est une comparaison de deux MESURES, jamais
 * une projection.</p>
 *
 * <h3>Ce que « temps réel » promettait à tort</h3>
 * <p>Rien ne se rafraîchissait tout seul : ni intervalle, ni horodatage, ni moyen de relire
 * hors état d'erreur. Le titre promettait ce que l'écran ne tenait pas. Il dit désormais
 * quand il a lu, et donne le bouton pour relire.</p>
 */
export function RentabiliteView() {
  const [dateArret, setDateArret] = useState(dateDuJour());
  const dateReference = useMemo(() => memeJourMoisPrecedent(dateArret), [dateArret]);

  const requete = useRentabiliteQuery(dateArret);
  const { data, dataUpdatedAt, isError, isFetching, isLoading, refetch } = requete;

  /*
   * Le mois précédent est une SECONDE LECTURE du même service. Son échec ne doit rien
   * casser : la colonne de comparaison se remplit de tirets, et `EtatFinancier` sait déjà
   * dire qu'un tiret est une absence et non un zéro.
   */
  const { data: precedent } = useRentabiliteQuery(dateReference);

  const sections = useMemo(
    () => (data ? construireCompteDeResultat(data, precedent ?? null) : []),
    [data, precedent],
  );

  const marge = data ? tauxMarge(data) : null;
  const margePrecedente = precedent ? tauxMarge(precedent) : null;
  const parJour = data ? resultatParJour(data) : null;
  const parJourPrecedent = precedent ? resultatParJour(precedent) : null;

  const moisComplet = data ? data.joursEcoules >= data.nbJours : false;
  const avancement = data
    ? Math.min(100, Math.max(0, (Math.min(data.joursEcoules, data.nbJours) / data.nbJours) * 100))
    : 0;

  const heureDeLecture = dataUpdatedAt
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
        new Date(dataUpdatedAt),
      )
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rentabilité du mois</h1>
          {data && (
            <p className="text-sm text-muted">
              {enMoisLisible(data.dateArret)}, arrêté au {enDateLisible(data.dateArret)}.{' '}
              {data.joursEcoules} jour{data.joursEcoules > 1 ? 's' : ''} écoulé
              {data.joursEcoules > 1 ? 's' : ''}.
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <DatePicker
            className="w-52"
            /*
             * Sans borne haute, une date future répond 200 et l'écran affiche un déficit
             * fabriqué : le socle de charges fixes est imputé au prorata de jours qui ne
             * sont pas encore passés.
             */
            maxValue={aujourdhui(getLocalTimeZone())}
            onChange={(d: DateValue | null) => {
              if (d) setDateArret(d.toString());
            }}
            value={enDateCalendaire(dateArret)}
          >
            <Label>Date d&apos;arrêté</Label>
            <DateField.Group>
              <DateField.Input>
                {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                  <DateField.Segment segment={segment} />
                )}
              </DateField.Input>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar>
                <Calendar.Header>
                  <Calendar.NavButton slot="previous">
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </Calendar.NavButton>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="next">
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Calendar.NavButton>
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(j: string) => <Calendar.HeaderCell>{j}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(d: CalendarDate) => <Calendar.Cell date={d} />}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>

          {heureDeLecture && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <span>Lu à {heureDeLecture}</span>
              <Button
                aria-label="Relire"
                isIconOnly
                isPending={isFetching}
                onPress={() => void refetch()}
                size="sm"
                variant="ghost"
              >
                <RefreshCcw aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Spinner />
          <p className="text-sm text-muted">Calcul de la rentabilité…</p>
        </div>
      )}

      {/* L'echec n'offrait aucune reprise : il fallait recharger la page entiere. */}
      {isError && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>La rentabilité n’a pas pu être calculée.</Alert.Description>
          </Alert.Content>
          <Button isPending={isFetching} onPress={() => void refetch()} size="sm" variant="outline">
            Réessayer
          </Button>
        </Alert>
      )}

      {data && !isLoading && (
        <>
          {/*
           * Le résultat, en pleine largeur. C'est la seule couleur de l'écran, et elle dit
           * une seule chose : de quel côté de zéro on se trouve. Le reste de la page est en
           * teintes neutres, donc cette couleur-là se voit.
           */}
          <CarteStat
            accent
            libelle={`Résultat au ${enDateLisible(data.dateArret)}`}
            note={`Chiffre d'affaires ${formatMontant(data.caCumule)} moins dépenses retenues ${formatMontant(data.totalCumule)}`}
            ton={data.marge ? 'succes' : 'danger'}
            valeur={montantSigne(data.profit)}
          >
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted">
                {marge !== null && (
                  <span>
                    Marge {pourcentSigne(marge)} du chiffre d&apos;affaires
                  </span>
                )}
                {precedent && (
                  <span>
                    Au {enDateLisible(precedent.dateArret)} : {montantSigne(precedent.profit)}
                    {margePrecedente !== null && `, marge ${pourcentSigne(margePrecedente)}`}
                  </span>
                )}
                {parJour !== null && (
                  <span>
                    Par jour écoulé : {montantSigne(parJour)}
                    {parJourPrecedent !== null &&
                      `, contre ${montantSigne(parJourPrecedent)} le mois précédent`}
                  </span>
                )}
              </div>

              {/*
               * La phrase n'extrapole pas : elle traduit le manque CONSTATÉ en son
               * équivalent quotidien, à dépenses inchangées. C'est l'unité dans laquelle
               * on agit sur les jours qui restent.
               */}
              {!data.marge && parJour !== null && (
                <p className="text-sm text-foreground">
                  Il manque {formatMontant(Math.abs(parJour))} de chiffre d&apos;affaires par
                  jour pour revenir à l&apos;équilibre, au rythme actuel des dépenses.
                </p>
              )}

              <div className="flex flex-col gap-1">
                {/*
                 * `ProgressBar` remplit en ACCENT par defaut, le rouge de marque : ici
                 * l'avancement du mois n'appelle aucune action, d'ou `color="default"`.
                 */}
                {/*
                  * Bridee en largeur ET en epaisseur. Etiree sur toute la carte elle court sur
                  * plus de 1 300 px et se lit comme un filet en travers du bloc ; en taille
                  * normale, son remplissage presque noir devient la marque la plus lourde de la
                  * carte, alors qu'elle y porte le fait le moins important. `size="sm"` est la
                  * variante prevue pour cela : on n'ecrit pas sa peinture a la main.
                  */}
                <ProgressBar
                  aria-label="Avancement du mois"
                  className="max-w-sm"
                  color="default"
                  size="sm"
                  value={avancement}
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <p className="text-[11px] text-muted">
                  {moisComplet
                    ? 'Mois complet. Le socle des charges fixes est imputé en entier.'
                    : `Jour ${data.joursEcoules} sur ${data.nbJours}.`}{' '}
                  Mois de référence : {data.nbJours} jours, convention de calcul du prorata.
                </p>
              </div>
            </div>
          </CarteStat>

          {/*
           * Le compte lui-même. Deux colonnes des MÊMES grandeurs, au même jour de deux mois
           * consécutifs : on compare des mesures, on ne projette rien.
           */}
          <EtatFinancier
            libelleCumul={precedent ? `Au ${enDateLisible(precedent.dateArret)}` : 'Mois précédent'}
            libellePeriode={`Au ${enDateLisible(data.dateArret)}`}
            sections={sections}
          />

          {/*
           * CE QUE CET ÉCRAN COMPTE, ET CE QU'IL NE COMPTE PAS.
           *
           * Les dépenses retenues ici ne sont pas celles du grand livre : ce total AJOUTE un
           * socle de charges fixes modélisé au prorata, et il RETIENT les seules dépenses
           * variables de la période. Deux écrans voisins donnent donc deux résultats
           * différents, et se taire là-dessus laisse croire que l'un des deux se trompe.
           */}
          <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-muted">
            Les dépenses retenues comptent {formatMontant(data.fixeProrata)} de charges fixes
            imputées au prorata ({formatMontant(data.coutJournalier)} par jour sur{' '}
            {formatMontant(data.chargesFixesMensuelles)} mensuels), plus{' '}
            {formatMontant(data.variableReel)} de dépenses variables constatées. Ce périmètre
            n&apos;est pas celui du grand livre des dépenses, qui enregistre les décaissements
            réels sans socle modélisé : les deux écrans ne donnent pas le même résultat, et
            c&apos;est attendu.
          </p>
        </>
      )}
    </div>
  );
}
