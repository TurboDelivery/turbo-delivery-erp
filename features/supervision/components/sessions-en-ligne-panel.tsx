'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Chip, InputGroup, Label, Modal, Table, TextField } from '@heroui-v3/react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { supervisionAPI } from '../apis/supervision.api';
import { useForcerDeconnexionMutation, useSessionsEnLigneQuery } from '../queries/supervision.queries';
import { ExporteurOnglet, ISessionErp, STATUT_ACTIVITE_COULEURS, STATUT_ACTIVITE_LABELS } from '../types';
import { exporterSessions } from '../utils/supervision-export.utils';
import { dureeSessionVivante, formatDuree, formatHeure, initiales, libellePage } from '../utils/supervision-format.utils';

/**
 * Horloge locale (1 s) : elle ne rafraîchit AUCUNE donnée, elle ne sert qu'à
 * ré-afficher la durée de session entre deux allers-retours réseau. Le
 * rafraîchissement des données, lui, est confié au `refetchInterval` de React
 * Query — c'est la seule cadence qui parle au serveur.
 */
function useHorloge(intervalleMs = 1000): number {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), intervalleMs);
    return () => clearInterval(id);
  }, [intervalleMs]);
  return maintenant;
}

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'utilisateur', libelle: 'Utilisateur' },
  { id: 'page', libelle: 'Page en cours' },
  { id: 'connecte', libelle: 'Connecté à' },
  { id: 'duree', libelle: 'Durée' },
  { id: 'statut', libelle: 'Statut' },
  { id: 'action', libelle: 'Action' },
] as const;

const STATUTS = [
  { label: 'Tous', value: 'TOUS' },
  { label: 'Actif', value: 'ACTIF' },
  { label: 'Inactif', value: 'INACTIF' },
  { label: 'En instance', value: 'EN_INSTANCE' },
] as const;

interface Props {
  userId: string;
  /** Vrai si l'utilisateur peut `manage` le sujet CASL Supervision. */
  peutForcerDeconnexion: boolean;
  enregistrerExport: (exporteur: ExporteurOnglet | null) => void;
}

/**
 * Onglet « Utilisateurs en ligne » (F1/F2).
 *
 * Les filtres sont appliqués côté client : le jeu de données est celui des
 * personnes présentes à l'instant t (quelques dizaines de lignes), et un filtrage
 * local garde la clé React Query stable — sans quoi chaque frappe relancerait le
 * cycle de rafraîchissement 30 s.
 */
export function SessionsEnLignePanel({ userId, peutForcerDeconnexion, enregistrerExport }: Props) {
  const maintenant = useHorloge();
  const {
    data,
    isPending: isLoading,
    isFetching,
    isError,
    refetch,
  } = useSessionsEnLigneQuery(userId, {
    agence: '',
    statut: '',
    recherche: '',
  });
  const forcer = useForcerDeconnexionMutation(userId);

  const [agence, setAgence] = useState('TOUTES');
  const [statut, setStatut] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [aDeconnecter, setADeconnecter] = useState<ISessionErp | null>(null);

  const sessions = useMemo(() => data ?? [], [data]);

  const agences = useMemo(() => {
    const noms = new Set<string>();
    sessions.forEach((s) => {
      if (s.agence?.trim()) noms.add(s.agence.trim());
    });
    return Array.from(noms).sort();
  }, [sessions]);

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return sessions.filter((s) => {
      if (agence !== 'TOUTES' && s.agence !== agence) return false;
      if (statut !== 'TOUS' && s.statutActivite !== statut) return false;
      if (!q) return true;
      return [s.utilisateur, s.role, s.agence, s.moduleCourant, s.ecranCourant].filter(Boolean).some((valeur) => String(valeur).toLowerCase().includes(q));
    });
  }, [sessions, agence, statut, recherche]);

  // ── Export CSV de l'onglet (déclenché depuis l'entête de page) ─────────────
  const exporter = useCallback(() => {
    const { lignes: n } = exporterSessions(lignes);
    if (n === 0) {
      toast.info('Aucune session à exporter.');
      return;
    }
    // Règle de gestion 5 : un export est un événement d'audit à part entière. Le fichier
    // est produit à partir de ce qui est à l'écran ; l'appel ci-dessous ne sert qu'à
    // déclarer l'export au backend (qui trace « qui a exporté quoi, avec quels filtres »).
    // Volontairement non bloquant : un journal indisponible ne prive pas du fichier.
    void supervisionAPI.enLigne(userId, { agence: '', statut: '', recherche: '' }, { export: true }).catch(() => undefined);
    toast.success(`${n} session${n > 1 ? 's' : ''} exportée${n > 1 ? 's' : ''}.`);
  }, [lignes, userId]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  const confirmerDeconnexion = () => {
    if (!aDeconnecter) return;
    forcer.mutate(aDeconnecter.id, { onSettled: () => setADeconnecter(null) });
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-48">
          <ChampListe
            label="Agence"
            onChange={(v) => setAgence(v || 'TOUTES')}
            options={[{ label: 'Toutes', value: 'TOUTES' }, ...agences.map((nom) => ({ label: nom, value: nom }))]}
            placeholder="Toutes"
            valeur={agence}
          />
        </div>
        <div className="w-44">
          <ChampListe label="Statut" onChange={(v) => setStatut(v || 'TOUS')} options={STATUTS} placeholder="Tous" valeur={statut} />
        </div>
        <TextField className="min-w-56 flex-1" onChange={setRecherche} value={recherche}>
          <Label>Recherche</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Search aria-hidden="true" className="size-4" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Utilisateur, rôle, écran…" />
          </InputGroup>
        </TextField>
      </div>

      {/* L echec REMPLACE le tableau : « Aucun utilisateur ne correspond aux filtres »
          se lit comme un ERP desert, alors que la liste des presences n a pas pu
          etre lue et que tout le monde est peut-etre connecte. */}
      {isError ? (
        <EtatErreur quoi="les utilisateurs en ligne" onReessayer={() => void refetch()} enCours={isFetching} />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Utilisateurs en ligne" className="min-w-[64rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column id={c.id} isRowHeader={c.id === 'utilisateur'} key={c.id}>
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body renderEmptyState={() => (isLoading ? null : <p className="py-8 text-center text-sm text-muted">Aucun utilisateur ne correspond aux filtres.</p>)}>
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

                {(isLoading ? [] : lignes).map((session) => (
                  <Table.Row id={session.id} key={session.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-2.5">
                        {/* C'etait un rond dessine a la main : la bibliotheque a un avatar. */}
                        <Avatar className="shrink-0" size="sm">
                          <Avatar.Fallback>{initiales(session.utilisateur)}</Avatar.Fallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{session.utilisateur ?? 'Utilisateur inconnu'}</p>
                          <p className="truncate text-xs text-muted">{[session.role, session.agence].filter(Boolean).join(' · ') || '—'}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-foreground">{libellePage(session)}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{formatHeure(session.loginAt, false)}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{formatDuree(dureeSessionVivante(session, maintenant))}</Table.Cell>
                    <Table.Cell>
                      <Chip color={STATUT_ACTIVITE_COULEURS[session.statutActivite] ?? 'default'} size="sm" variant="soft">
                        <Chip.Label className="whitespace-nowrap">
                          {session.statutActivite === 'ACTIF' ? 'Actif' : `${STATUT_ACTIVITE_LABELS[session.statutActivite] ?? session.statutActivite} ${formatDuree(session.inactifDepuisS)}`}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      {peutForcerDeconnexion ? (
                        <Button isDisabled={forcer.isPending} onPress={() => setADeconnecter(session)} size="sm" variant="danger-soft">
                          Forcer la déconnexion
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{isError ? '—' : `${lignes.length} session${lignes.length > 1 ? 's' : ''} affichée${lignes.length > 1 ? 's' : ''} sur ${sessions.length}`}</span>
        <span>Rafraîchissement automatique toutes les 30 s</span>
      </div>

      {/* Confirmation — seule action d'écriture de tout l'écran. */}
      <Modal isOpen={!!aDeconnecter} onOpenChange={(ouvert) => !ouvert && setADeconnecter(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="flex flex-col gap-1">
                  <span>Forcer la déconnexion</span>
                  <span className="text-xs font-normal text-muted">
                    {aDeconnecter?.utilisateur ?? 'Session'} · {libellePage(aDeconnecter ?? ({} as ISessionErp))}
                  </span>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-2 text-sm text-foreground">
                <p>La session sera fermée et l&apos;action journalisée à votre nom. Le poste concerné sera déconnecté au prochain battement, soit 30 secondes au plus.</p>
                <p className="text-xs text-muted">Le travail non enregistré de cet utilisateur sera perdu.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setADeconnecter(null)} size="sm" variant="ghost">
                  Annuler
                </Button>
                <Button isPending={forcer.isPending} onPress={confirmerDeconnexion} size="sm" variant="danger">
                  Forcer la déconnexion
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
