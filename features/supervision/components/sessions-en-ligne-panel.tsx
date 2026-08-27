'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { supervisionAPI } from '../apis/supervision.api';
import { useForcerDeconnexionMutation, useSessionsEnLigneQuery } from '../queries/supervision.queries';
import {
  ExporteurOnglet,
  ISessionErp,
  STATUT_ACTIVITE_COULEURS,
  STATUT_ACTIVITE_LABELS,
} from '../types';
import { exporterSessions } from '../utils/supervision-export.utils';
import {
  dureeSessionVivante,
  formatDuree,
  formatHeure,
  initiales,
  libellePage,
} from '../utils/supervision-format.utils';

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
  const { data, isLoading, isFetching } = useSessionsEnLigneQuery(userId, {
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
      return [s.utilisateur, s.role, s.agence, s.moduleCourant, s.ecranCourant]
        .filter(Boolean)
        .some((valeur) => String(valeur).toLowerCase().includes(q));
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
    void supervisionAPI
      .enLigne(userId, { agence: '', statut: '', recherche: '' }, { export: true })
      .catch(() => undefined);
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
        <Select
          aria-label="Filtrer par agence"
          label="Agence"
          size="sm"
          className="w-48"
          selectedKeys={[agence]}
          onSelectionChange={(cles) => setAgence((Array.from(cles)[0] as string) ?? 'TOUTES')}
        >
          {[
            <SelectItem key="TOUTES">Toutes</SelectItem>,
            ...agences.map((nom) => <SelectItem key={nom}>{nom}</SelectItem>),
          ]}
        </Select>
        <Select
          aria-label="Filtrer par statut"
          label="Statut"
          size="sm"
          className="w-44"
          selectedKeys={[statut]}
          onSelectionChange={(cles) => setStatut((Array.from(cles)[0] as string) ?? 'TOUS')}
        >
          <SelectItem key="TOUS">Tous</SelectItem>
          <SelectItem key="ACTIF">Actif</SelectItem>
          <SelectItem key="INACTIF">Inactif</SelectItem>
          <SelectItem key="EN_INSTANCE">En instance</SelectItem>
        </Select>
        <Input
          aria-label="Rechercher un utilisateur"
          label="Recherche"
          size="sm"
          placeholder="Utilisateur, rôle, écran…"
          className="min-w-[14rem] flex-1"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={recherche}
          onValueChange={setRecherche}
          isClearable
          onClear={() => setRecherche('')}
        />
      </div>

      <Table aria-label="Utilisateurs en ligne" isStriped removeWrapper>
        <TableHeader>
          <TableColumn className="text-primary">UTILISATEUR</TableColumn>
          <TableColumn className="text-primary">PAGE EN COURS</TableColumn>
          <TableColumn className="text-primary">CONNECTÉ À</TableColumn>
          <TableColumn className="text-primary">DURÉE</TableColumn>
          <TableColumn className="text-primary">STATUT</TableColumn>
          <TableColumn className="text-primary">ACTION</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucun utilisateur ne correspond aux filtres.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement des présences…" />}
        >
          {lignes.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-default-100 text-[11px] font-semibold text-default-600">
                    {initiales(session.utilisateur)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.utilisateur ?? 'Utilisateur inconnu'}</p>
                    <p className="truncate text-[11px] text-default-400">
                      {[session.role, session.agence].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-default-600">{libellePage(session)}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-default-500">
                {formatHeure(session.loginAt, false)}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-default-500">
                {formatDuree(dureeSessionVivante(session, maintenant))}
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="dot"
                  color={STATUT_ACTIVITE_COULEURS[session.statutActivite] ?? 'default'}
                >
                  {session.statutActivite === 'ACTIF'
                    ? 'Actif'
                    : `${STATUT_ACTIVITE_LABELS[session.statutActivite] ?? session.statutActivite} ${formatDuree(
                        session.inactifDepuisS,
                      )}`}
                </Chip>
              </TableCell>
              <TableCell>
                {peutForcerDeconnexion ? (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setADeconnecter(session)}
                    isDisabled={forcer.isPending}
                  >
                    Forcer la déconnexion
                  </Button>
                ) : (
                  <span className="text-[11px] text-default-400">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-default-400">
        <span>
          {lignes.length} session{lignes.length > 1 ? 's' : ''} affichée{lignes.length > 1 ? 's' : ''} sur{' '}
          {sessions.length}
        </span>
        <span>Rafraîchissement automatique toutes les 30 s</span>
      </div>

      {/* Confirmation — seule action d'écriture de tout l'écran. */}
      <Modal isOpen={!!aDeconnecter} onOpenChange={(ouvert) => !ouvert && setADeconnecter(null)} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Forcer la déconnexion</span>
            <span className="text-xs font-normal text-default-500">
              {aDeconnecter?.utilisateur ?? 'Session'} · {libellePage(aDeconnecter ?? ({} as ISessionErp))}
            </span>
          </ModalHeader>
          <ModalBody className="text-sm text-default-600">
            <p>
              La session sera fermée et l&apos;action journalisée à votre nom. Le poste concerné sera déconnecté
              au prochain battement, soit 30 secondes au plus.
            </p>
            <p className="text-xs text-default-400">
              Le travail non enregistré de cet utilisateur sera perdu.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" size="sm" onPress={() => setADeconnecter(null)}>
              Annuler
            </Button>
            <Button color="danger" size="sm" isLoading={forcer.isPending} onPress={confirmerDeconnexion}>
              Forcer la déconnexion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
