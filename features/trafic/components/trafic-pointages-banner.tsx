'use client';

import Link from 'next/link';
import { Button } from '@/components/heroui';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import { usePointagesEnAttenteQuery } from '@/features/trafic/queries/pointages-attente.query';

const LIEN_ARBITRAGE = '/delivery-men/pointages-a-valider';

/**
 * Bandeau d'action : les pointages hors-zone qui attendent un arbitrage.
 *
 * C'est le chaînon manquant entre le pointage et le trafic. Ces livreurs ont
 * pointé loin de leur poste : tant que la décision n'est pas prise, ils
 * n'entrent pas en file — donc ils ne reçoivent aucune course, sans que rien à
 * l'écran ne le signale. Le bandeau ne s'affiche que s'il y a réellement
 * quelque chose à arbitrer.
 */
export function TraficPointagesBanner() {
  const { data } = usePointagesEnAttenteQuery();
  const enAttente = data?.length ?? 0;

  if (enAttente === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-warning-500/15">
        <ShieldAlert className="h-[22px] w-[22px] text-warning-600 dark:text-warning-400" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
          {enAttente} pointage{enAttente > 1 ? 's' : ''} en attente de validation
        </p>
        <p className="text-[12px] leading-snug text-warning-700/80 dark:text-warning-300/80">
          Ces livreurs ne reçoivent aucune course tant que la décision n&apos;est pas prise.
        </p>
      </div>
      <Button
        as={Link}
        href={LIEN_ARBITRAGE}
        size="sm"
        radius="lg"
        className="bg-[#17181C] text-white dark:bg-white dark:text-[#17181C]"
        endContent={<ArrowRight className="h-4 w-4" />}
      >
        Arbitrer les pointages
      </Button>
    </div>
  );
}
