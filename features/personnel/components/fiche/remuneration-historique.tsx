'use client';

import { Table } from '@heroui-v3/react';

import EtatErreur from '@/components/commons/EtatErreur';
import { IRemunerationHistorique } from '@/features/personnel/types/personnel-historisation.types';
import {
  formaterMontant,
  formaterMontantSigne,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { EtatMoisChip } from '../shared/personnel-chips';

interface Props {
  chargement: boolean;
  /** L'appel a echoue. Distinct d'un agent sans rémunération enregistrée. */
  echec?: boolean;
  historique: IRemunerationHistorique | undefined;
  /** Relance l'appel. Absente, l'echec s'affiche sans bouton. */
  onReessayer?: () => void;
  /** Vrai pendant la nouvelle tentative. */
  relanceEnCours?: boolean;
}

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { alignDroite: false, id: 'mois', libelle: 'Mois' },
  { alignDroite: true, id: 'base', libelle: 'Base' },
  { alignDroite: true, id: 'primes', libelle: 'Primes' },
  { alignDroite: true, id: 'retenues', libelle: 'Retenues / pertes' },
  { alignDroite: true, id: 'net', libelle: 'Net payé' },
  { alignDroite: false, id: 'etat', libelle: 'État' },
  { alignDroite: true, id: 'ecart', libelle: 'Écart' },
] as const;

/**
 * Historique mensuel de rémunération d'un agent (F3).
 *
 * Ce que le métier regarde n'est pas le montant du mois mais l'écart avec le précédent :
 * c'est ce que porte la dernière colonne. Le backend calcule cet écart sur le net TOTAL
 * (ligne principale + régularisations payées ce mois-là), donc sur ce que l'agent a
 * réellement touché.
 */
export function RemunerationHistorique({
  chargement,
  echec = false,
  historique,
  onReessayer,
  relanceEnCours = false,
}: Props) {
  const mois = historique?.mois ?? [];
  // « Aucune rémunération enregistrée » sur un appel tombé se lit comme un agent jamais payé.
  const enEchec = echec && mois.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Historique mensuel de rémunération" className="min-w-[56rem]">
            <Table.Header>
              {COLONNES.map((c) => (
                <Table.Column
                  className={c.alignDroite ? 'text-right' : undefined}
                  id={c.id}
                  isRowHeader={c.id === 'mois'}
                  key={c.id}
                >
                  {c.libelle}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body
              renderEmptyState={() =>
                chargement ? null : enEchec ? (
                  <div className="py-6">
                    <EtatErreur
                      enCours={relanceEnCours}
                      onReessayer={onReessayer}
                      quoi="les rémunérations de cet agent"
                    />
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted">
                    Aucune rémunération enregistrée pour cet agent.
                  </p>
                )
              }
            >
              {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
              {chargement
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                      {COLONNES.map((c) => (
                        <Table.Cell key={`sq-${i}-${c.id}`}>
                          <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : null}

              {(chargement || enEchec ? [] : mois).map((m) => (
                <Table.Row id={m.mois} key={m.mois}>
                  <Table.Cell className="font-medium whitespace-nowrap text-foreground">
                    {m.moisLibelle}
                    {!m.saisi ? <span className="ml-1 text-xs text-muted">(non saisi)</span> : null}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {formaterMontant(m.base)}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {m.primes ? formaterMontant(m.primes) : '—'}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {m.retenues ? (
                      <div>
                        <div className="text-danger-soft-foreground">
                          −{formaterMontant(m.retenues)}
                        </div>
                        {(m.detailRetenues ?? []).length > 0 ? (
                          <div className="text-xs text-muted">
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
                  </Table.Cell>
                  <Table.Cell className="text-right font-semibold tabular-nums">
                    {formaterMontant(m.netTotal ?? m.net)}
                    {(m.regularisations ?? []).length > 0 ? (
                      <div className="text-xs font-normal text-muted">
                        dont régularisation{' '}
                        {(m.regularisations ?? [])
                          .map((r) => r.moisOrigineLibelle ?? r.moisOrigine)
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <EtatMoisChip statut={m.cloture ? 'CLOTURE' : 'OUVERT'} />
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    <span
                      className={
                        m.sensEcart === 'GAIN'
                          ? 'text-success-soft-foreground'
                          : m.sensEcart === 'PERTE'
                            ? 'text-danger-soft-foreground'
                            : 'text-muted'
                      }
                    >
                      {m.ecart === null || m.ecart === undefined
                        ? '—'
                        : formaterMontantSigne(m.ecart)}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <p className="text-xs text-muted">
        Les mois clôturés sont figés : toute correction passe par une régularisation tracée sur le
        mois ouvert.
      </p>
    </div>
  );
}
