'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, InputGroup, Label, Table, TextField } from '@heroui-v3/react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { useConnexionsQuery } from '../queries/supervision.queries';
import { useRechercheDifferee } from '../hooks/use-recherche-differee';
import { ExporteurOnglet, IConnexionsFiltre, TYPE_EVENEMENT_COULEURS, TYPE_EVENEMENT_LABELS, TYPES_EVENEMENT } from '../types';
import { exporterConnexions, messageTroncature } from '../utils/supervision-export.utils';
import { formatDuree, formatInstant, utilisateurConnexion } from '../utils/supervision-format.utils';

const TAILLE_PAGE = 25;

/** Périodes proposées, exprimées en jours (null = toute la profondeur conservée). */
const PERIODES: { cle: string; libelle: string; jours: number | null }[] = [
  { cle: 'JOUR', libelle: "Aujourd'hui", jours: 0 },
  { cle: 'SEMAINE', libelle: '7 derniers jours', jours: 7 },
  { cle: 'MOIS', libelle: '30 derniers jours', jours: 30 },
  { cle: 'TOUT', libelle: 'Tout l’historique', jours: null },
];

/** Borne basse `YYYY-MM-DD` correspondant à une période. */
function borneDepuis(cle: string): string {
  const periode = PERIODES.find((p) => p.cle === cle);
  if (!periode || periode.jours === null) return '';
  const date = new Date();
  date.setDate(date.getDate() - periode.jours);
  return date.toISOString().slice(0, 10);
}

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'horodatage', libelle: 'Horodatage' },
  { id: 'utilisateur', libelle: 'Utilisateur' },
  { id: 'evenement', libelle: 'Événement' },
  { id: 'ip', libelle: 'Adresse IP' },
  { id: 'appareil', libelle: 'Appareil' },
  { id: 'session', libelle: 'Session' },
] as const;

interface Props {
  userId: string;
  enregistrerExport: (exporteur: ExporteurOnglet | null) => void;
}

/**
 * Onglet « Connexions » (F4) : connexions, échecs, déconnexions et expirations.
 *
 * Un échec sur un identifiant inconnu n'a pas d'utilisateur rattaché — seule la
 * chaîne saisie est journalisée, et c'est précisément la ligne qu'un auditeur
 * cherche : elle est donc affichée telle quelle, signalée « compte inconnu ».
 */
export function ConnexionsPanel({ userId, enregistrerExport }: Props) {
  const [typeEvenement, setTypeEvenement] = useState('TOUS');
  const [periode, setPeriode] = useState('JOUR');
  const [page, setPage] = useState(0);
  const [saisie, setSaisie, recherche] = useRechercheDifferee();

  useEffect(() => {
    setPage(0);
  }, [typeEvenement, periode, recherche]);

  const filtre: IConnexionsFiltre = useMemo(
    () => ({
      typeEvenement: typeEvenement === 'TOUS' ? '' : typeEvenement,
      recherche,
      depuis: borneDepuis(periode),
      jusqua: '',
      page,
    }),
    [typeEvenement, recherche, periode, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useConnexionsQuery(userId, filtre, TAILLE_PAGE);
  const lignes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.totalElements ?? 0;

  const exporter = useCallback(async () => {
    try {
      const bilan = await exporterConnexions(userId, filtre);
      const n = bilan.lignes;
      if (n === 0) toast.info('Aucun événement à exporter pour ces critères.');
      // Un export coupé n'est JAMAIS annoncé comme complet : l'avertissement est aussi
      // écrit en première ligne du fichier (cf. supervision-export.utils).
      else if (bilan.tronque) toast.warning(messageTroncature(bilan), { duration: 12000 });
      else toast.success(`${n} événement${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}.`);
    } catch {
      toast.error("Échec de l'export du journal des connexions.");
    }
  }, [userId, filtre]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <ChampListe
            label="Événement"
            onChange={(v) => setTypeEvenement(v || 'TOUS')}
            options={[
              { label: 'Tous', value: 'TOUS' },
              ...TYPES_EVENEMENT.map((type) => ({
                label: TYPE_EVENEMENT_LABELS[type],
                value: type,
              })),
            ]}
            placeholder="Tous"
            valeur={typeEvenement}
          />
        </div>
        <div className="w-48">
          <ChampListe
            label="Période"
            onChange={(v) => setPeriode(v || 'JOUR')}
            options={PERIODES.map((p) => ({ label: p.libelle, value: p.cle }))}
            placeholder="Choisir une période"
            valeur={periode}
          />
        </div>
        <TextField className="min-w-56 flex-1" onChange={setSaisie} value={saisie}>
          <Label>Recherche</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Search aria-hidden="true" className="size-4" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Utilisateur, identifiant, IP…" />
          </InputGroup>
        </TextField>
      </div>

      {/* L echec REMPLACE le tableau : « Aucun evenement pour ces criteres » se lit
          comme un journal vide, et un auditeur en conclurait qu il ne s est rien
          passe alors que le journal n a pas pu etre lu. */}
      {isError ? (
        <EtatErreur quoi="le journal des connexions" onReessayer={() => void refetch()} enCours={isFetching} />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Journal des connexions" className="min-w-[64rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column id={c.id} isRowHeader={c.id === 'horodatage'} key={c.id}>
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body renderEmptyState={() => (isLoading ? null : <p className="py-8 text-center text-sm text-muted">Aucun événement pour ces critères.</p>)}>
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

                {(isLoading ? [] : lignes).map((connexion) => (
                  <Table.Row id={connexion.id} key={connexion.id}>
                    <Table.Cell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">{formatInstant(connexion.occurredAt)}</Table.Cell>
                    <Table.Cell className="text-sm font-medium">{utilisateurConnexion(connexion.utilisateur, connexion.identifiant)}</Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col gap-0.5">
                        <Chip color={TYPE_EVENEMENT_COULEURS[connexion.typeEvenement] ?? 'default'} size="sm" variant="soft">
                          <Chip.Label className="whitespace-nowrap">{TYPE_EVENEMENT_LABELS[connexion.typeEvenement] ?? connexion.typeEvenement}</Chip.Label>
                        </Chip>
                        {connexion.motif && <span className="text-xs text-muted">{connexion.motif}</span>}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="font-mono text-xs text-muted">{connexion.ip ?? '—'}</Table.Cell>
                    <Table.Cell className="max-w-56 text-muted">
                      <span className="block truncate" title={connexion.appareil ?? ''}>
                        {connexion.appareil ?? '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="font-mono text-xs text-muted">
                      {connexion.sessionId ? <span title={connexion.sessionId}>{connexion.sessionId.slice(0, 8)}</span> : '—'}
                      {connexion.dureeSessionS != null && <span className="ml-1 text-muted">· {formatDuree(connexion.dureeSessionS)}</span>}
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
        <span>{isError ? '—' : `${total} événement${total > 1 ? 's' : ''} pour ces critères`}</span>
        <span>Journal en lecture seule — conservation 24 mois</span>
      </div>
    </div>
  );
}
