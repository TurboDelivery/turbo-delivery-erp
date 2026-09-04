'use client';

import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';

import EtatErreur from '@/components/commons/EtatErreur';
import { IRemunerationHistorique } from '@/features/personnel/types/personnel-historisation.types';
import {
  formaterMontant,
  formaterMontantSigne,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { EtatMoisChip } from '../shared/personnel-chips';

interface Props {
  historique: IRemunerationHistorique | undefined;
  chargement: boolean;
  /** L'appel a echoue. Distinct d'un agent sans rémunération enregistrée. */
  echec?: boolean;
  /** Relance l'appel. Absente, l'echec s'affiche sans bouton. */
  onReessayer?: () => void;
  /** Vrai pendant la nouvelle tentative. */
  relanceEnCours?: boolean;
}

/**
 * Historique mensuel de rémunération d'un agent (F3).
 *
 * Ce que le métier regarde n'est pas le montant du mois mais l'écart avec le précédent :
 * c'est ce que porte la dernière colonne. Le backend calcule cet écart sur le net TOTAL
 * (ligne principale + régularisations payées ce mois-là), donc sur ce que l'agent a
 * réellement touché.
 */
export function RemunerationHistorique({ historique, chargement, echec = false, onReessayer, relanceEnCours = false }: Props) {
  const mois = historique?.mois ?? [];
  // « Aucune rémunération enregistrée » sur un appel tombe se lit comme un agent jamais paye.
  const enEchec = echec && mois.length === 0;

  return (
    <div className="space-y-2">
      <Table aria-label="Historique mensuel de rémunération" removeWrapper isStriped>
        <TableHeader>
          <TableColumn className="text-primary">MOIS</TableColumn>
          <TableColumn className="text-right text-primary">BASE</TableColumn>
          <TableColumn className="text-right text-primary">PRIMES</TableColumn>
          <TableColumn className="text-right text-primary">RETENUES / PERTES</TableColumn>
          <TableColumn className="text-right text-primary">NET PAYÉ</TableColumn>
          <TableColumn className="text-primary">ÉTAT</TableColumn>
          <TableColumn className="text-right text-primary">ÉCART</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            enEchec ? (
              <EtatErreur quoi="les rémunérations de cet agent" onReessayer={onReessayer} enCours={relanceEnCours} />
            ) : chargement ? (
              ' '
            ) : (
              'Aucune rémunération enregistrée pour cet agent.'
            )
          }
          isLoading={chargement}
          loadingContent={<Spinner color="primary" label="Chargement des rémunérations…" />}
        >
          {mois.map((m) => (
            <TableRow key={m.mois}>
              <TableCell className="whitespace-nowrap font-medium text-default-700">
                {m.moisLibelle}
                {!m.saisi ? <span className="ml-1 text-[10.5px] text-default-400">(non saisi)</span> : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formaterMontant(m.base)}</TableCell>
              <TableCell className="text-right tabular-nums">{m.primes ? formaterMontant(m.primes) : '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {m.retenues ? (
                  <div>
                    <div className="text-danger-soft-foreground">−{formaterMontant(m.retenues)}</div>
                    {(m.detailRetenues ?? []).length > 0 ? (
                      <div className="text-[10.5px] text-default-400">
                        {(m.detailRetenues ?? [])
                          .map((r) => r.motif)
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formaterMontant(m.netTotal ?? m.net)}
                {(m.regularisations ?? []).length > 0 ? (
                  <div className="text-[10.5px] font-normal text-default-400">
                    dont régularisation{' '}
                    {(m.regularisations ?? [])
                      .map((r) => r.moisOrigineLibelle ?? r.moisOrigine)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <EtatMoisChip statut={m.cloture ? 'CLOTURE' : 'OUVERT'} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span
                  className={
                    m.sensEcart === 'GAIN'
                      ? 'text-success-soft-foreground'
                      : m.sensEcart === 'PERTE'
                        ? 'text-danger-soft-foreground'
                        : 'text-default-400'
                  }
                >
                  {m.ecart === null || m.ecart === undefined ? '—' : formaterMontantSigne(m.ecart)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-[11px] text-default-400">
        Les mois clôturés sont figés : toute correction passe par une régularisation tracée sur le mois ouvert.
      </p>
    </div>
  );
}
