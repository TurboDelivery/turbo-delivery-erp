'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from '@/components/heroui';
import { CalendarDays, Info, TrendingDown, TrendingUp } from 'lucide-react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { useRentabiliteQuery } from '@/features/rentabilite';
import { formatMontant } from '@/utils/format.utils';

const today = () => new Date().toISOString().slice(0, 10);

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-0.5 text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className="text-default-600">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

/** Widget Rentabilité temps réel (§8) : date d'arrêté, marge/déficit, décomposition des dépenses. */
export function RentabiliteView() {
  const [dateArret, setDateArret] = useState(today());
  const { data, isLoading, isError } = useRentabiliteQuery(dateArret);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Rentabilité — temps réel</h1>
          <p className="text-sm text-default-500">
            Prorata des charges fixes + dépenses variables vs CA cumulé
          </p>
        </div>
        <Input
          type="date"
          label="Date d'arrêté"
          size="sm"
          className="w-52"
          value={dateArret}
          onValueChange={setDateArret}
          startContent={<CalendarDays className="h-4 w-4 text-default-400" />}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner color="primary" label="Calcul de la rentabilité…" />
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 py-10 text-center text-sm text-rose-600">
          Erreur de chargement de la rentabilité.
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          {/* Hero marge / déficit */}
          <Card
            shadow="none"
            className={`border ${data.marge ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
          >
            <CardBody className="flex flex-row items-center justify-between gap-4 p-5">
              <div>
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    data.marge ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {data.marge ? 'Marge' : 'Déficit'} · arrêté au {data.dateArret} (jour {data.joursEcoules}/
                  {data.nbJours})
                </p>
                <p
                  className={`text-3xl font-bold tabular-nums ${
                    data.marge ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {data.profit < 0 ? '- ' : ''}
                  {formatMontant(Math.abs(data.profit))}
                </p>
                <p className="text-xs text-default-500">
                  CA cumulé {formatMontant(data.caCumule)} − Dépenses {formatMontant(data.totalCumule)}
                </p>
              </div>
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  data.marge ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {data.marge ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              </span>
            </CardBody>
          </Card>

          <GrilleStats colonnes={3}>
            <CarteStat libelle="CA cumulé" valeur={formatMontant(data.caCumule)} />

            {/* Le bouton reste le declencheur du popover : CarteStat n'expose pas
                la ref ni les gestionnaires de press attendus par PopoverTrigger. */}
            <Popover placement="bottom" showArrow>
              <PopoverTrigger>
                <button type="button" className="block h-full text-left">
                  {/* L'icone Info annonce que le detail est dans le popover. CarteStat
                      la pose dans la pastille a droite, jamais en ligne apres le libelle. */}
                  <CarteStat
                    libelle="Total dépenses (cumulé)"
                    valeur={formatMontant(data.totalCumule)}
                    icone={Info}
                    className="h-full"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3">
                <p className="mb-2 text-sm font-semibold">Décomposition des dépenses</p>
                <Row k="Charges fixes (prorata)" v={formatMontant(data.fixeProrata)} />
                <p className="pl-1 text-xs text-default-400">
                  {formatMontant(data.coutJournalier)}/j × {data.joursEcoules} j
                </p>
                <Row k="Dépenses variables (réel)" v={formatMontant(data.variableReel)} />
                <div className="mt-1 border-t border-default-200 pt-1">
                  <Row k="Total" v={formatMontant(data.totalCumule)} bold />
                </div>
              </PopoverContent>
            </Popover>

            <CarteStat
              libelle="Coût journalier"
              valeur={formatMontant(data.coutJournalier)}
              note={`${formatMontant(data.chargesFixesMensuelles)} / ${data.nbJours} j`}
            />
          </GrilleStats>
        </div>
      )}
    </div>
  );
}
