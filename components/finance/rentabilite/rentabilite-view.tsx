'use client';

import {
  Alert,
  Button,
  Calendar,
  Card,
  DateField,
  DatePicker,
  Label,
  Popover,
  Separator,
  Spinner,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, Info, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { useRentabiliteQuery } from '@/features/rentabilite';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

const today = () => new Date().toISOString().slice(0, 10);

function Row({ bold, k, v }: { bold?: boolean; k: string; v: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-0.5 text-sm',
        bold && 'font-semibold',
      )}
    >
      <span className="text-muted">{k}</span>
      <span className="tabular-nums text-foreground">{v}</span>
    </div>
  );
}

function enDateCalendaire(iso: string): CalendarDate | null {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
}

/**
 * Widget Rentabilité temps réel (§8) : date d'arrêté, marge/déficit, décomposition des
 * dépenses.
 *
 * <p>La carte de tête était peinte en `emerald-50 / emerald-200 / emerald-700` ou
 * `rose-*` selon le signe — six teintes de la palette Tailwind, sans variante sombre : en
 * thème sombre, du texte vert foncé sur un fond vert pâle. Marge et déficit sont un ÉTAT,
 * donc ils passent par les jetons `success` et `danger` du thème. La date d'arrêté était
 * un `<input type="date">` brut.</p>
 */
export function RentabiliteView() {
  const [dateArret, setDateArret] = useState(today());
  const { data, isError, isFetching, isLoading, refetch } = useRentabiliteQuery(dateArret);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rentabilité — temps réel</h1>
          <p className="text-sm text-muted">
            Prorata des charges fixes + dépenses variables vs CA cumulé
          </p>
        </div>

        <DatePicker
          className="w-52"
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
        <div className="flex flex-col gap-4">
          {/* Marge ou déficit — le seul endroit de l'écran où la couleur dit quelque chose. */}
          <Card
            className={cn(
              'border',
              data.marge ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5',
            )}
          >
            <Card.Content className="flex-row items-center justify-between gap-4">
              <div>
                <p
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    data.marge ? 'text-success-soft-foreground' : 'text-danger-soft-foreground',
                  )}
                >
                  {data.marge ? 'Marge' : 'Déficit'} · arrêté au {data.dateArret} (jour{' '}
                  {data.joursEcoules}/{data.nbJours})
                </p>
                <p
                  className={cn(
                    'text-3xl font-bold tabular-nums',
                    data.marge ? 'text-success-soft-foreground' : 'text-danger-soft-foreground',
                  )}
                >
                  {data.profit < 0 ? '- ' : ''}
                  {formatMontant(Math.abs(data.profit))}
                </p>
                <p className="text-xs text-muted">
                  CA cumulé {formatMontant(data.caCumule)} − Dépenses{' '}
                  {formatMontant(data.totalCumule)}
                </p>
              </div>
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-xl',
                  data.marge
                    ? 'bg-success/15 text-success-soft-foreground'
                    : 'bg-danger/15 text-danger-soft-foreground',
                )}
              >
                {data.marge ? (
                  <TrendingUp aria-hidden="true" className="size-6" />
                ) : (
                  <TrendingDown aria-hidden="true" className="size-6" />
                )}
              </span>
            </Card.Content>
          </Card>

          <GrilleStats colonnes={3}>
            <CarteStat libelle="CA cumulé" valeur={formatMontant(data.caCumule)} />

            {/* Le declencheur reste un bouton autour de la carte : `CarteStat` n'expose ni
                la ref ni les gestionnaires de press attendus par le `Popover`. */}
            <Popover>
              <Button className="h-full p-0 text-left" variant="ghost">
                {/* L'icone Info annonce que le detail est dans le popover. CarteStat
                    la pose dans la pastille a droite, jamais en ligne apres le libelle. */}
                <CarteStat
                  className="h-full"
                  icone={Info}
                  libelle="Total dépenses (cumulé)"
                  valeur={formatMontant(data.totalCumule)}
                />
              </Button>
              <Popover.Content className="w-72">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Décomposition des dépenses
                </p>
                <Row k="Charges fixes (prorata)" v={formatMontant(data.fixeProrata)} />
                <p className="pl-1 text-xs text-muted">
                  {formatMontant(data.coutJournalier)}/j × {data.joursEcoules} j
                </p>
                <Row k="Dépenses variables (réel)" v={formatMontant(data.variableReel)} />
                <Separator className="my-1" />
                <Row bold k="Total" v={formatMontant(data.totalCumule)} />
              </Popover.Content>
            </Popover>

            <CarteStat
              libelle="Coût journalier"
              note={`${formatMontant(data.chargesFixesMensuelles)} / ${data.nbJours} j`}
              valeur={formatMontant(data.coutJournalier)}
            />
          </GrilleStats>
        </div>
      )}
    </div>
  );
}
