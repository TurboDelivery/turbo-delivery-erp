'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Chip, ComboBox, Input, ListBox, Spinner, Table } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { CheckCircle2, PenLine, ShieldCheck, Wallet } from 'lucide-react';
import { fmtFcfa, unifiedStatut, FinanceStatut } from '@/features/finances-hub';
import {
  useActeursHistoriqueQuery,
  useHistoriqueChargesQuery,
} from '@/features/charges/queries/historique-charge.query';
import { IHistoriqueCharge } from '@/features/charges/types/historique-charge.type';
import EtatErreur from '@/components/commons/EtatErreur';

const PAGE_SIZE = 12;

/*
 * `color` porte l'echelle semantique, `variant` l'intensite. Les deux etats de passage —
 * vise, approuve — portaient `primary` et `secondary`, c'est-a-dire deux couleurs de
 * marque : ils n'appellent aucun geste, ils passent au ton neutre.
 */
const STATUT: Record<
  FinanceStatut,
  { color: 'danger' | 'default' | 'success' | 'warning'; label: string; plein: boolean }
> = {
  approuve: { color: 'default', label: 'Approuvé DG', plein: true },
  paye: { color: 'success', label: 'Payé', plein: true },
  pending: { color: 'warning', label: 'En attente', plein: false },
  rejete: { color: 'danger', label: 'Rejeté', plein: true },
  vise: { color: 'default', label: 'Visé DGA', plein: false },
};

const COLONNES = ['designation', 'categorie', 'montant', 'statut', 'actions'];

// ISO → « 07/04 · 14h30 » (ou « 07/04 » sans l'heure).
const fmtDate = (iso?: string | null, avecHeure = false): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const jour = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (!avecHeure) return jour;
  return `${jour} · ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Onglet « Mon historique » — actions menées sur les dépenses (création / visa DGA /
 * accord DG). L'utilisateur voit SES actions ; l'admin voit tout le monde et peut
 * filtrer par utilisateur. Le nom d'acteur = session.user.name (cf. useFinancesHub).
 */
export function FinanceHistoriqueTab({
  debut,
  fin,
  isAdmin,
  moi,
}: {
  debut?: string;
  fin?: string;
  isAdmin: boolean;
  moi: string;
}) {
  const [page, setPage] = useState(1);
  // Admin : '' = tout le monde ; sinon un acteur ciblé. Non-admin : toujours « moi ».
  const [utilisateur, setUtilisateur] = useState('');

  const par = isAdmin ? (utilisateur || undefined) : moi;

  // Liste des acteurs pour le filtre admin.
  const { data: acteurs } = useActeursHistoriqueQuery(isAdmin);

  const { data, isLoading, isError, isFetching, refetch } = useHistoriqueChargesQuery({
    page: page - 1,
    size: PAGE_SIZE,
    debut,
    fin,
    par,
  });

  const rows: IHistoriqueCharge[] = (data as any)?.content ?? [];
  const totalPages = Math.max(1, (data as any)?.totalPages ?? 1);
  const totalElements = (data as any)?.totalElements ?? rows.length;

  // Retour page 1 quand le filtre change.
  useEffect(() => { setPage(1); }, [par, debut, fin]);
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  const options = useMemo(() => acteurs ?? [], [acteurs]);

  return (
    <div className="flex flex-col gap-3">
      {/* Barre filtre (admin uniquement) */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <ComboBox
            aria-label="Filtrer par utilisateur"
            className="w-full sm:w-72"
            onSelectionChange={(c) => setUtilisateur(c === 'TOUS' ? '' : String(c ?? ''))}
            selectedKey={utilisateur || 'TOUS'}
          >
            <ComboBox.InputGroup>
              <Input placeholder="Tous les utilisateurs" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                items={[
                  { cle: 'TOUS', libelle: 'Tous les utilisateurs' },
                  ...options.map((a) => ({ cle: a, libelle: a })),
                ]}
              >
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <span className="text-xs text-muted">
            {totalElements} action{totalElements > 1 ? 's' : ''}
          </span>
        </div>
      )}
      {!isAdmin && (
        <p className="text-sm text-muted">
          Vos actions sur les dépenses (création, visa, accord) —{' '}
          <span className="font-semibold text-foreground">{moi}</span>.
        </p>
      )}

      {isError ? (
        // sans cette branche, l'echec affichait "Aucune action sur cette periode",
        // indiscernable d'un vrai vide
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="l'historique des actions" />
      ) : (
        <Card>
          <Card.Content className="p-0">
            {/*
             * Un `<table>` BRUT, avec ses `<th>` et ses `<td>` peints a la main :
             * `CLAUDE.md` interdit explicitement le balisage de tableau ecrit a la main.
             */}
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Historique des actions" className="min-w-[52rem]">
                  <Table.Header>
                    <Table.Column id="designation" isRowHeader>
                      Désignation
                    </Table.Column>
                    <Table.Column id="categorie">Catégorie</Table.Column>
                    <Table.Column id="montant">Montant</Table.Column>
                    <Table.Column id="statut">Statut</Table.Column>
                    <Table.Column id="actions">Actions menées</Table.Column>
                  </Table.Header>

                  <Table.Body
                    renderEmptyState={() =>
                      isLoading ? null : (
                        <p className="py-10 text-center text-sm text-muted">
                          Aucune action sur cette période.
                        </p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                            {COLONNES.map((c) => (
                              <Table.Cell key={`sq-${i}-${c}`}>
                                <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading ? [] : rows).map((r) => {
                      const st = unifiedStatut(r.statut);
                      return (
                        <Table.Row id={`${r.type}-${r.id}`} key={`${r.type}-${r.id}`}>
                          <Table.Cell>
                            <span className="block font-semibold text-foreground">
                              {r.designation}
                            </span>
                            <span className="block text-[11px] text-muted">
                              {r.type === 'FIXE' ? 'Charge fixe' : 'Dépense variable'}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <span className="text-muted">{r.categorie?.nomCategorie ?? '—'}</span>
                          </Table.Cell>

                          <Table.Cell>
                            <span className="block text-right font-semibold tabular-nums">
                              {fmtFcfa(r.montant)}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <Chip
                              color={STATUT[st].color}
                              size="sm"
                              variant={STATUT[st].plein ? 'primary' : 'soft'}
                            >
                              <Chip.Label>{STATUT[st].label}</Chip.Label>
                            </Chip>
                          </Table.Cell>

                          <Table.Cell>
                            {/*
                             * Les quatre lignes d'action portaient chacune une couleur —
                             * `text-primary-600`, `text-secondary-600`, `text-success-600` —
                             * pour dire QUI a fait quoi, alors que le nom est ecrit juste
                             * a cote. L'icone suffit a distinguer les etapes.
                             */}
                            <div className="flex flex-col gap-1 text-[12px] text-muted">
                              {r.creerPar && (
                                <span className="inline-flex items-center gap-1.5">
                                  <PenLine aria-hidden="true" className="size-3.5" />
                                  Créé par <b className="text-foreground">{r.creerPar}</b>
                                  {r.createdAt && <span>· {fmtDate(r.createdAt, true)}</span>}
                                </span>
                              )}
                              {r.validePar && (
                                <span className="inline-flex items-center gap-1.5">
                                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                                  Visé par <b className="text-foreground">{r.validePar}</b>
                                  {r.dateValidationDGA && (
                                    <span>· {fmtDate(r.dateValidationDGA, true)}</span>
                                  )}
                                </span>
                              )}
                              {r.approuvePar && (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                                  Approuvé par <b className="text-foreground">{r.approuvePar}</b>
                                  {r.dateApprobationDG && (
                                    <span>· {fmtDate(r.dateApprobationDG, true)}</span>
                                  )}
                                </span>
                              )}
                              {r.dateDecaissement && (
                                <span className="inline-flex items-center gap-1.5 text-success-soft-foreground">
                                  <Wallet aria-hidden="true" className="size-3.5" />
                                  Décaissé · {fmtDate(r.dateDecaissement, true)}
                                </span>
                              )}
                              {!r.creerPar &&
                                !r.validePar &&
                                !r.approuvePar &&
                                !r.dateDecaissement && <span>—</span>}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              <Table.Footer className="justify-between gap-2">
                <span className="text-xs text-muted">
                  {totalElements} action{totalElements > 1 ? 's' : ''}
                  {isFetching ? ' · actualisation…' : ''}
                </span>
                <PaginationTableau onPage={setPage} page={page} total={totalPages} />
              </Table.Footer>
            </Table>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
