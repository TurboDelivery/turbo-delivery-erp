'use client';

import { Button, Card, Checkbox, Chip, Modal, Table } from '@heroui-v3/react';
import { History, Pencil } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  ChampListe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { formatMontant } from '@/utils/format.utils';
import {
  useCommissionHistoryQuery,
  useModifierCommissionMutation,
} from '@/features/restaurants/commissions/commission.query';
import {
  ICommissionVersion,
  TypeCommissionVersion,
} from '@/features/restaurants/commissions/commission.types';

const TYPE_OPTIONS: { label: string; value: TypeCommissionVersion }[] = [
  { label: 'Pourcentage (%)', value: 'POURCENTAGE' },
  { label: 'Montant fixe (FCFA)', value: 'MONTANT_FIXE' },
  { label: 'Aucune commission', value: 'AUCUNE' },
];

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'type', libelle: 'Type' },
  { id: 'valeur', libelle: 'Valeur' },
  { id: 'seuil', libelle: 'Seuil' },
  { id: 'periode', libelle: "Période d'effet" },
  { id: 'statut', libelle: 'Statut' },
  { id: 'origine', libelle: 'Origine' },
  { id: 'auteur', libelle: 'Auteur' },
  { id: 'motif', libelle: 'Motif' },
] as const;

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatType(t: TypeCommissionVersion): string {
  return t === 'POURCENTAGE' ? 'Pourcentage' : t === 'MONTANT_FIXE' ? 'Montant fixe' : 'Aucune';
}

function formatValeur(v: ICommissionVersion): string {
  if (v.type === 'AUCUNE') return '—';
  if (v.type === 'POURCENTAGE') return `${v.valeur} %`;
  return `${formatMontant(Number(v.valeur))}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'en cours';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

/**
 * L'origine d'une version de commission.
 *
 * <p>« Initiale » était en `primary` — la couleur de MARQUE — pour dire la version issue
 * de la migration : une provenance, pas un état. Reste l'ambre du RÉTROACTIF, qui, lui,
 * dit qu'une période déjà passée a été recalculée.</p>
 */
function sourceChip(source: string) {
  const map: Record<string, { label: string; ton: 'default' | 'warning' }> = {
    MANUEL: { label: 'Manuel', ton: 'default' },
    MIGRATION: { label: 'Initiale', ton: 'default' },
    RETROACTIF: { label: 'Rétroactif', ton: 'warning' },
  };
  const cfg = map[source] ?? { label: source, ton: 'default' as const };
  return (
    <Chip color={cfg.ton} size="sm" variant="soft">
      <Chip.Label>{cfg.label}</Chip.Label>
    </Chip>
  );
}

export function CommissionHistorySection({ restaurantId }: { restaurantId: string }) {
  const { data: versions, isLoading, isError, isFetching, refetch } = useCommissionHistoryQuery(restaurantId);
  const mutation = useModifierCommissionMutation(restaurantId);
  const [ouvert, setOuvert] = useState(false);

  const [type, setType] = useState<TypeCommissionVersion>('POURCENTAGE');
  const [valeur, setValeur] = useState<string>('0');
  const [seuil, setSeuil] = useState<string>('');
  const [dateEffet, setDateEffet] = useState<string>(todayISO());
  const [motif, setMotif] = useState<string>('');
  const [retroactif, setRetroactif] = useState<boolean>(false);

  const isAnterior = useMemo(() => dateEffet < todayISO(), [dateEffet]);

  function resetForm() {
    setType('POURCENTAGE');
    setValeur('0');
    setSeuil('');
    setDateEffet(todayISO());
    setMotif('');
    setRetroactif(false);
  }

  async function onSubmit() {
    try {
      const res = await mutation.mutateAsync({
        dateEffet,
        type,
        valeur: type === 'AUCUNE' ? 0 : Number(valeur) || 0,
        seuil: type === 'MONTANT_FIXE' && seuil !== '' ? Number(seuil) : null,
        motif: motif.trim() || null,
        retroactif: isAnterior && retroactif,
      });
      const suffix =
        isAnterior && retroactif
          ? ` — ${res.coursesRecalculees} course(s) non recouvrée(s) recalculée(s)`
          : '';
      toast.success(`Commission mise à jour${suffix}`);
      resetForm();
      setOuvert(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la mise à jour de la commission');
    }
  }

  const list = versions ?? [];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <History aria-hidden="true" className="size-4 text-muted" /> Historique des commissions
        </h2>
        <Button
          onPress={() => {
            resetForm();
            setOuvert(true);
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Modifier la commission
        </Button>
      </div>

      {isError ? (
        // Les versions datees sont opposables : annoncer "aucune version"
        // sur un echec de lecture ferait poser une commission a l'aveugle.
        <EtatErreur
          enCours={isFetching}
          onReessayer={() => refetch()}
          quoi="les versions de commission"
        />
      ) : (
        <>
          {/* Desktop : tableau */}
          <Card className="hidden md:block">
            <Card.Content className="p-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Historique des commissions" className="min-w-[64rem]">
                    <Table.Header>
                      {COLONNES.map((c) => (
                        <Table.Column id={c.id} isRowHeader={c.id === 'type'} key={c.id}>
                          {c.libelle}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body
                      renderEmptyState={() =>
                        isLoading ? null : (
                          <p className="py-8 text-center text-sm text-muted">
                            Aucune version de commission enregistrée.
                          </p>
                        )
                      }
                    >
                      {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                      {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                              {COLONNES.map((c) => (
                                <Table.Cell key={`sq-${i}-${c.id}`}>
                                  <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))
                        : null}

                      {(isLoading ? [] : list).map((v) => (
                        <Table.Row id={v.id} key={v.id}>
                          <Table.Cell>{formatType(v.type)}</Table.Cell>
                          <Table.Cell className="font-semibold tabular-nums">
                            {formatValeur(v)}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums">
                            {v.seuil != null ? `${formatMontant(Number(v.seuil))}` : '—'}
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap">
                            {formatDate(v.dateDebutEffet)} → {formatDate(v.dateFinEffet)}
                          </Table.Cell>
                          <Table.Cell>
                            <Chip color={v.courante ? 'success' : 'default'} size="sm" variant="soft">
                              <Chip.Label>{v.courante ? 'Courante' : 'Historique'}</Chip.Label>
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>{sourceChip(v.source)}</Table.Cell>
                          <Table.Cell className="text-muted">{v.auteurNom ?? '—'}</Table.Cell>
                          <Table.Cell className="max-w-[200px] truncate text-muted">
                            {v.motif ?? '—'}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </Card.Content>
          </Card>

          {/* Mobile : cartes */}
          <div className="flex flex-col gap-3 md:hidden">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={i} />
                ))
              : list.length === 0
                ? (
                    <p className="py-4 text-sm text-muted">
                      Aucune version de commission enregistrée.
                    </p>
                  )
                : list.map((v) => (
                    <Card key={v.id}>
                      <Card.Content className="gap-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-muted">{formatType(v.type)}</p>
                            <p className="text-sm font-semibold tabular-nums text-foreground">
                              {formatValeur(v)}
                            </p>
                          </div>
                          {v.courante ? (
                            <Chip color="success" size="sm" variant="soft">
                              <Chip.Label>Courante</Chip.Label>
                            </Chip>
                          ) : (
                            sourceChip(v.source)
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted">Période</span>
                          <span className="text-right text-sm text-foreground">
                            {formatDate(v.dateDebutEffet)} → {formatDate(v.dateFinEffet)}
                          </span>
                        </div>
                        {v.seuil != null && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-muted">Seuil</span>
                            <span className="text-sm tabular-nums text-foreground">
                              {formatMontant(Number(v.seuil))}
                            </span>
                          </div>
                        )}
                        {v.auteurNom && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-muted">Auteur</span>
                            <span className="text-right text-sm text-foreground">{v.auteurNom}</span>
                          </div>
                        )}
                        {v.motif && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-muted">Motif</span>
                            <span className="text-right text-sm text-foreground">{v.motif}</span>
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
          </div>
        </>
      )}

      {/* Modale — modifier la commission */}
      <Modal isOpen={ouvert} onOpenChange={setOuvert}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                <Modal.Heading>Modifier la commission</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <ChampListe
                  label="Type de commission"
                  onChange={(v) => setType((v as TypeCommissionVersion) || 'POURCENTAGE')}
                  options={TYPE_OPTIONS}
                  placeholder="Choisir un type"
                  valeur={type}
                />

                {type !== 'AUCUNE' && (
                  <ChampMontant
                    label={type === 'POURCENTAGE' ? 'Taux (%)' : 'Montant fixe (FCFA)'}
                    max={type === 'POURCENTAGE' ? 100 : undefined}
                    onChange={(v) => setValeur(String(v))}
                    valeur={Number(valeur) || 0}
                  />
                )}

                {type === 'MONTANT_FIXE' && (
                  <ChampMontant
                    aide="Montant minimum de commande sous lequel la commission ne s'applique pas. Une zone peut définir son propre seuil dans la grille tarifaire (prioritaire)."
                    label="Seuil d'application — défaut partenaire (FCFA, optionnel)"
                    onChange={(v) => setSeuil(String(v))}
                    valeur={seuil === '' ? undefined : Number(seuil)}
                  />
                )}

                <ChampTexte
                  label="Date d'effet"
                  onChange={setDateEffet}
                  type="date"
                  valeur={dateEffet}
                />

                <ChampZoneTexte
                  label="Motif (optionnel)"
                  lignes={2}
                  onChange={setMotif}
                  valeur={motif}
                />

                {isAnterior && (
                  <Checkbox isSelected={retroactif} onChange={setRetroactif}>
                    <Checkbox.Content className="items-start">
                      <Checkbox.Control className="mt-0.5">
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="flex-1 text-left text-sm">
                        Appliquer à une période antérieure (recalcule les courses{' '}
                        <span className="font-semibold">non encore recouvrées</span> depuis cette
                        date)
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setOuvert(false)} type="button" variant="ghost">
                  Annuler
                </Button>
                <Button
                  isPending={mutation.isPending}
                  onPress={onSubmit}
                  type="button"
                  variant="primary"
                >
                  Enregistrer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}
