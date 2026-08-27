'use client';

import { useState } from 'react';
import {
  Button,
  Chip,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { Ear, Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  ContexteAppel,
  IAppelLog,
  StatutAppel,
  STATUT_APPEL_LABEL,
  useAppelsQuery,
} from '@/features/standard';

import { useAppel } from './appel-provider';

const CONTEXTE_LABEL: Record<ContexteAppel, string> = {
  LIVREUR_VERS_STANDARD: 'Livreur → Standard',
  STANDARD_VERS_LIVREUR: 'Standard → Livreur',
  PAIR_VERS_PAIR: 'Pair → Pair',
};

const STATUT_COLOR: Record<
  StatutAppel,
  'success' | 'primary' | 'warning' | 'danger' | 'default'
> = {
  INITIE: 'warning',
  SONNE: 'warning',
  EN_COURS: 'primary',
  TERMINE: 'success',
  REJETE: 'danger',
  MANQUE: 'danger',
  ANNULE: 'default',
};

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuree(sec: number | null): string {
  if (sec == null || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AppelHistoriqueTable() {
  const [page, setPage] = useState(0);
  // Rafraîchit périodiquement pour faire remonter les appels EN COURS (écoute).
  // 30 s et non 8 : le socket pousse déjà les six évènements APPEL_*, ce poll n'est
  // qu'un filet, et il tournait à 450 requêtes par heure sur un simple journal.
  const { data, isLoading, isError, isFetching, refetch } = useAppelsQuery(page, 15, 30_000);
  const { superviser, estSuperviseur, enAppel } = useAppel();
  const appels: IAppelLog[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <section className="rounded-2xl border border-default-200/50 bg-white p-4 dark:bg-content1">
      <h2 className="mb-3 flex items-center gap-2.5 text-sm font-bold text-default-700">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Phone className="h-5 w-5" />
        </span>
        Historique des appels
      </h2>
      {isError ? (
        // Sans ce cas, une panne du journal affichait « Aucun appel enregistré »,
        // soit exactement ce que montre un standard sans activite.
        <EtatErreur quoi="les appels" onReessayer={() => refetch()} enCours={isFetching} />
      ) : (
      <Table
        aria-label="Historique des appels"
        isStriped
        bottomContent={
          totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPages}
                page={page + 1}
                onChange={(p) => setPage(p - 1)}
                color="primary"
                showControls
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn className="text-primary">DATE</TableColumn>
          <TableColumn className="text-primary">SENS</TableColumn>
          <TableColumn className="text-primary">N° / DESTINATAIRE</TableColumn>
          <TableColumn className="text-primary">STATUT</TableColumn>
          <TableColumn className="text-primary">DURÉE</TableColumn>
          <TableColumn className="text-primary text-right">ÉCOUTER</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? ' ' : 'Aucun appel enregistré'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement de l'historique…" />}
        >
          {appels.map((a) => {
            const entrant = a.contexte === 'LIVREUR_VERS_STANDARD';
            return (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-default-500">
                  {formatInstant(a.declencheLe)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {entrant ? (
                      <PhoneIncoming className="h-4 w-4 text-success" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4 text-primary" />
                    )}
                    {CONTEXTE_LABEL[a.contexte] ?? a.contexte}
                  </span>
                </TableCell>
                <TableCell>
                  {a.appeleTelephone ?? <span className="text-default-400">—</span>}
                </TableCell>
                <TableCell>
                  {a.statut ? (
                    <Chip size="sm" variant="flat" color={STATUT_COLOR[a.statut] ?? 'default'}>
                      {STATUT_APPEL_LABEL[a.statut] ?? a.statut}
                    </Chip>
                  ) : (
                    <span className="text-default-300">—</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{formatDuree(a.dureeSec)}</TableCell>
                <TableCell className="text-right">
                  {a.statut === 'EN_COURS' && estSuperviseur ? (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Ear className="h-4 w-4" />}
                      isDisabled={enAppel}
                      onPress={() =>
                        superviser(
                          a.id,
                          `${a.appelantNom ?? 'Appelant'} ↔ ${a.appeleNom ?? a.appeleTelephone ?? 'Appelé'}`,
                        )
                      }
                    >
                      Écouter
                    </Button>
                  ) : (
                    <span className="text-default-300">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}
    </section>
  );
}
