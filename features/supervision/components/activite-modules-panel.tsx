'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, InputGroup, Label, Table, TextField, Tooltip } from '@heroui-v3/react';

import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { useAuditActionsQuery, useModulesAuditQuery } from '../queries/supervision.queries';
import { useRechercheDifferee } from '../hooks/use-recherche-differee';
import { ExporteurOnglet, IActionsFiltre, TYPE_ACTION_COULEURS, TYPE_ACTION_LABELS, TYPES_ACTION } from '../types';
import { exporterActions, messageTroncature } from '../utils/supervision-export.utils';
import { formatHeure, formatInstant, libelleObjet } from '../utils/supervision-format.utils';
import { DiffValeurs } from './diff-valeurs';

const TAILLE_PAGE = 25;

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'heure', libelle: 'Heure' },
  { id: 'utilisateur', libelle: 'Utilisateur' },
  { id: 'module', libelle: 'Module' },
  { id: 'action', libelle: 'Action' },
  { id: 'objet', libelle: 'Objet concerné' },
  { id: 'detail', libelle: 'Détail (avant → après)' },
] as const;

interface Props {
  userId: string;
  enregistrerExport: (exporteur: ExporteurOnglet | null) => void;
}

/**
 * Onglet « Activité des modules » (F5) : le journal des actions métier.
 *
 * Écran strictement en lecture — le backend n'expose aucune route d'écriture sur
 * `audit_action`, et la table porte des triggers PostgreSQL qui refusent tout
 * UPDATE/DELETE, y compris en accès direct à la base.
 */
export function ActiviteModulesPanel({ userId, enregistrerExport }: Props) {
  const [module, setModule] = useState('TOUS');
  const [typeAction, setTypeAction] = useState('TOUS');
  const [depuis, setDepuis] = useState('');
  const [jusqua, setJusqua] = useState('');
  const [page, setPage] = useState(0);
  const [saisie, setSaisie, recherche] = useRechercheDifferee();

  // Toute modification de critère ramène à la première page — sinon on
  // atterrit sur une page 7 qui n'existe plus dans le nouveau jeu.
  useEffect(() => {
    setPage(0);
  }, [module, typeAction, depuis, jusqua, recherche]);

  const filtre: IActionsFiltre = useMemo(
    () => ({
      module: module === 'TOUS' ? '' : module,
      typeAction: typeAction === 'TOUS' ? '' : typeAction,
      recherche,
      depuis,
      jusqua,
      page,
    }),
    [module, typeAction, recherche, depuis, jusqua, page],
  );

  const { data: modules } = useModulesAuditQuery(userId);
  const { data, isLoading, isFetching, isError, refetch } = useAuditActionsQuery(userId, filtre, TAILLE_PAGE);

  const lignes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.totalElements ?? 0;

  const exporter = useCallback(async () => {
    try {
      const bilan = await exporterActions(userId, filtre);
      const n = bilan.lignes;
      if (n === 0) toast.info('Aucune action à exporter pour ces critères.');
      // Un export coupé n'est JAMAIS annoncé comme complet : l'avertissement est aussi
      // écrit en première ligne du fichier (cf. supervision-export.utils).
      else if (bilan.tronque) toast.warning(messageTroncature(bilan), { duration: 12000 });
      else toast.success(`${n} action${n > 1 ? 's' : ''} exportée${n > 1 ? 's' : ''}.`);
    } catch {
      toast.error("Échec de l'export du journal des actions.");
    }
  }, [userId, filtre]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-52">
          <ChampListe
            label="Module"
            onChange={(v) => setModule(v || 'TOUS')}
            options={[{ label: 'Tous les modules', value: 'TOUS' }, ...(modules ?? []).map((nom) => ({ label: nom, value: nom }))]}
            placeholder="Tous les modules"
            valeur={module}
          />
        </div>
        <div className="w-56">
          <ChampListe
            label="Action"
            onChange={(v) => setTypeAction(v || 'TOUS')}
            options={[{ label: 'Toutes', value: 'TOUS' }, ...TYPES_ACTION.map((type) => ({ label: TYPE_ACTION_LABELS[type], value: type }))]}
            placeholder="Toutes"
            valeur={typeAction}
          />
        </div>
        <div className="w-40">
          <ChampTexte label="Du" onChange={setDepuis} type="date" valeur={depuis} />
        </div>
        <div className="w-40">
          <ChampTexte label="Au" onChange={setJusqua} type="date" valeur={jusqua} />
        </div>
        <TextField className="min-w-56 flex-1" onChange={setSaisie} value={saisie}>
          <Label>Recherche</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Search aria-hidden="true" className="size-4" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Utilisateur, objet, référence…" />
          </InputGroup>
        </TextField>
      </div>

      {/* L echec REMPLACE le tableau : « Aucune action pour ces criteres » se lit
          comme un journal vide, alors qu il n a simplement pas pu etre lu. */}
      {isError ? (
        <EtatErreur quoi="le journal des actions" onReessayer={() => void refetch()} enCours={isFetching} />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Journal des actions métier" className="min-w-[68rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column id={c.id} isRowHeader={c.id === 'heure'} key={c.id}>
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body renderEmptyState={() => (isLoading ? null : <p className="py-8 text-center text-sm text-muted">Aucune action pour ces critères.</p>)}>
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {COLONNES.map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(isLoading ? [] : lignes).map((action) => (
                  <Table.Row id={action.id} key={action.id}>
                    <Table.Cell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">
                      <Tooltip>
                        <span>{formatHeure(action.occurredAt)}</span>
                        <Tooltip.Content>{formatInstant(action.occurredAt)}</Tooltip.Content>
                      </Tooltip>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm font-medium">{action.utilisateur ?? 'Système'}</p>
                      {action.role && <p className="text-xs text-muted">{action.role}</p>}
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" variant="soft">
                        <Chip.Label className="whitespace-nowrap">{action.module ?? '—'}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip color={TYPE_ACTION_COULEURS[action.typeAction] ?? 'default'} size="sm" variant="soft">
                        <Chip.Label className="whitespace-nowrap">{TYPE_ACTION_LABELS[action.typeAction] ?? action.typeAction}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm font-medium">{libelleObjet(action)}</p>
                      {action.entiteId && (
                        <p className="truncate text-xs text-muted" title={action.entiteId}>
                          {action.entiteId}
                        </p>
                      )}
                    </Table.Cell>
                    <Table.Cell className="max-w-sm">
                      <DiffValeurs action={action} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>

          {totalPages > 1 && (
            <Table.Footer className="justify-center">
              <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
            </Table.Footer>
          )}
        </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{isError ? '—' : `${total} action${total > 1 ? 's' : ''} pour ces critères`}</span>
        <span>Audit central — toute écriture, dans tout module, est journalisée · lecture seule · rétention 24 mois</span>
      </div>
    </div>
  );
}
