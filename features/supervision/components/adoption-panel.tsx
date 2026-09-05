'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Chip, InputGroup, Label, Table, TextField } from '@heroui-v3/react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { AlertTriangle, Search } from 'lucide-react';

import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { supervisionAPI } from '../apis/supervision.api';
import { useAdoptionQuery } from '../queries/supervision.queries';
import { ExporteurOnglet } from '../types';
import { exporterAdoption } from '../utils/supervision-export.utils';
import { formatInstant, initiales } from '../utils/supervision-format.utils';

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'utilisateur', libelle: 'Utilisateur' },
  { id: 'role', libelle: 'Rôle' },
  { id: 'premiere', libelle: 'Première connexion' },
  { id: 'derniere', libelle: 'Dernière connexion' },
  { id: 'connexions', libelle: 'Connexions' },
  { id: 'adoption', libelle: "Statut d'adoption" },
] as const;

const FILTRES = [
  { label: 'Tous les comptes', value: 'TOUS' },
  { label: 'Jamais connectés', value: 'JAMAIS' },
] as const;

interface Props {
  userId: string;
  enregistrerExport: (exporteur: ExporteurOnglet | null) => void;
}

/**
 * Onglet « Premières connexions » (F3) — l'indicateur d'adoption.
 *
 * `premiereConnexionAt` est figé en base par trigger : il répond à « ce compte
 * a-t-il déjà servi ? » sans que personne puisse réécrire l'histoire. Un compte
 * jamais connecté signale une formation à faire ou un process resté hors système.
 */
export function AdoptionPanel({ userId, enregistrerExport }: Props) {
  const [filtre, setFiltre] = useState('TOUS');
  const [recherche, setRecherche] = useState('');

  const { data, isLoading, isFetching, isError, refetch } = useAdoptionQuery(userId, filtre === 'JAMAIS');

  const comptes = useMemo(() => {
    const liste = data?.comptes ?? [];
    const q = recherche.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter((compte) => [compte.utilisateur, compte.identifiant, compte.role].filter(Boolean).some((valeur) => String(valeur).toLowerCase().includes(q)));
  }, [data, recherche]);

  const exporter = useCallback(() => {
    const { lignes: n } = exporterAdoption(comptes);
    if (n === 0) {
      toast.info('Aucun compte à exporter.');
      return;
    }
    // Règle de gestion 5 : l'export est déclaré au backend, qui le trace avec ses filtres.
    // Non bloquant : le fichier est déjà produit à partir de ce qui est à l'écran.
    void supervisionAPI.adoption(userId, filtre === 'JAMAIS', { export: true }).catch(() => undefined);
    toast.success(`${n} compte${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}.`);
  }, [comptes, userId, filtre]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  return (
    <div className="space-y-4">
      {/* L'annuaire ERP est la seule source des comptes JAMAIS connectés : s'il est
          injoignable, un « 0 jamais connecté » serait un contresens, on le dit. */}
      {data && !data.annuaireDisponible && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground" />
          <p>
            Annuaire des comptes ERP injoignable : cette liste ne contient que les comptes ayant déjà laissé une trace de connexion. Les comptes <strong>jamais connectés</strong> n&apos;y figurent
            donc pas — le chiffre d&apos;adoption est incomplet tant que l&apos;annuaire n&apos;a pas répondu.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <ChampListe label="Filtre" onChange={(v) => setFiltre(v || 'TOUS')} options={FILTRES} placeholder="Tous les comptes" valeur={filtre} />
        </div>
        <TextField className="min-w-56 flex-1" onChange={setRecherche} value={recherche}>
          <Label>Recherche</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Search aria-hidden="true" className="size-4" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Utilisateur, identifiant, rôle…" />
          </InputGroup>
        </TextField>
        <p className="pb-1 text-xs text-muted">Champ figé à la première connexion réussie — non modifiable</p>
      </div>

      {/* L echec REMPLACE le tableau : « Aucun compte ne correspond aux filtres »
          se lit comme une adoption complete, alors que la liste n a pas pu etre lue. */}
      {isError ? (
        <EtatErreur quoi="les premières connexions" onReessayer={() => void refetch()} enCours={isFetching} />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Premières connexions" className="min-w-[60rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column id={c.id} isRowHeader={c.id === 'utilisateur'} key={c.id}>
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body renderEmptyState={() => (isLoading ? null : <p className="py-8 text-center text-sm text-muted">Aucun compte ne correspond aux filtres.</p>)}>
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {COLONNES.map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(isLoading ? [] : comptes).map((compte, index) => (
                  // Un compte de l'annuaire peut n'avoir ni identifiant ni id résolu :
                  // l'index complète la clé plutôt que de risquer un doublon React.
                  <Table.Row id={compte.utilisateurId ?? compte.identifiant ?? `compte-${index}`} key={compte.utilisateurId ?? compte.identifiant ?? `compte-${index}`}>
                    <Table.Cell>
                      <div className="flex items-center gap-2.5">
                        {/* C'etait un rond dessine a la main : la bibliotheque a un avatar. */}
                        <Avatar className="shrink-0" size="sm">
                          <Avatar.Fallback>{initiales(compte.utilisateur ?? compte.identifiant)}</Avatar.Fallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{compte.utilisateur ?? 'Compte sans nom'}</p>
                          {compte.identifiant && <p className="truncate text-xs text-muted">{compte.identifiant}</p>}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-muted">{compte.role ?? '—'}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{compte.premiereConnexionAt ? formatInstant(compte.premiereConnexionAt) : '—'}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{compte.derniereConnexionAt ? formatInstant(compte.derniereConnexionAt) : '—'}</Table.Cell>
                    <Table.Cell className="tabular-nums text-muted">{compte.nbConnexions ?? 0}</Table.Cell>
                    <Table.Cell>
                      <Chip color={compte.jamaisConnecte ? 'default' : 'success'} size="sm" variant="soft">
                        <Chip.Label className="whitespace-nowrap">{compte.jamaisConnecte ? 'Jamais connecté' : 'Adopté'}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {isError ? (
            '—'
          ) : (
            <>
              {comptes.length} compte{comptes.length > 1 ? 's' : ''} affiché{comptes.length > 1 ? 's' : ''}
              {data ? ` · ${data.jamaisConnectes} jamais connecté${data.jamaisConnectes > 1 ? 's' : ''}` : ''}
            </>
          )}
        </span>
        <span>Un compte jamais connecté = formation à prévoir ou process hors système</span>
      </div>
    </div>
  );
}
