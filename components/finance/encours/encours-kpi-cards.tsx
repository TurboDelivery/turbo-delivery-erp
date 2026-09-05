'use client';

import { PiggyBank, ReceiptText, Store, TrendingUp, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import CarteStat, { GrilleStats, type TonStat } from '@/components/commons/CarteStat';
import { IEncoursReleve, computeKpis, formatFcfa } from '@/features/encours';

/**
 * Bandeau de 4 indicateurs (KPI) qui se recalculent selon les filtres (§5).
 *
 * <p>Portait sa propre carte, avec ses couleurs ecrites en classes de palette
 * (`bg-sky-50 text-sky-600`, `bg-violet-50`, `bg-emerald-50`) et deux tailles de chiffre
 * selon qu'une carte etait mise en avant ou non. Il passe par `CarteStat`, dont la prop
 * `accent` porte exactement cette mise en avant.</p>
 *
 * <p>Le ton du taux de recouvrement reste CONDITIONNEL, parce qu'il dit quelque chose :
 * au-dela de 70 % on encaisse, en dessous de 40 % on ne rentre pas dans ses frais.</p>
 */
export function EncoursKpiCards({ releve }: { releve: IEncoursReleve }) {
  const { facture, reste, deductions, taux } = computeKpis(releve);
  const tonTaux: TonStat = taux >= 70 ? 'succes' : taux >= 40 ? 'attention' : 'danger';

  const cartes: { libelle: string; valeur: string; icone: LucideIcon; ton: TonStat; accent?: boolean }[] = [
    { libelle: 'Total facturé', valeur: formatFcfa(facture), icone: ReceiptText, ton: 'primaire' },
    { libelle: 'Reste à payer · Encours', valeur: formatFcfa(reste), icone: Wallet, ton: 'primaire', accent: true },
    { libelle: 'Avances & déductions', valeur: formatFcfa(deductions), icone: PiggyBank, ton: 'neutre' },
    { libelle: 'Taux de recouvrement', valeur: `${taux} %`, icone: TrendingUp, ton: tonTaux },
  ];

  return (
    <div className="space-y-2">
      <GrilleStats colonnes={4}>
        {cartes.map((c) => (
          <CarteStat
            key={c.libelle}
            libelle={c.libelle}
            valeur={c.valeur}
            icone={c.icone}
            ton={c.ton}
            accent={c.accent}
          />
        ))}
      </GrilleStats>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Users aria-hidden="true" className="size-3.5" /> {releve.nbPartenaires} partenaire
          {releve.nbPartenaires > 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1">
          <Store aria-hidden="true" className="size-3.5" /> {releve.nbStores} point{releve.nbStores > 1 ? 's' : ''} de
          vente
        </span>
      </div>
    </div>
  );
}
