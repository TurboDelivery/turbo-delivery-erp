'use client';

import { useState } from 'react';
import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';

import { ContexteAppel, IAppelLog, StatutAppel } from '../types/standard.types';
import { useAppelsQuery } from '../queries/standard.query';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUT_LABEL: Record<StatutAppel, string> = {
  INITIE: 'Initié',
  SONNE: 'Sonne',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  REJETE: 'Refusé',
  MANQUE: 'Manqué',
  ANNULE: 'Annulé',
};

const STATUT_COLOR: Record<StatutAppel, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  INITIE: 'default',
  SONNE: 'default',
  EN_COURS: 'primary',
  TERMINE: 'success',
  REJETE: 'danger',
  MANQUE: 'warning',
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

/** Sens de l'appel du point de vue de la console STANDARD. */
function sens(contexte: ContexteAppel): { label: string; icon: typeof ArrowDownLeft; color: string } {
  switch (contexte) {
    case 'LIVREUR_VERS_STANDARD':
      return { label: 'Entrant', icon: ArrowDownLeft, color: 'text-success' };
    case 'STANDARD_VERS_LIVREUR':
      return { label: 'Sortant', icon: ArrowUpRight, color: 'text-primary' };
    default:
      return { label: 'Pair', icon: Users, color: 'text-default-400' };
  }
}

/** Journal des appels audio (M7, RG-24) — historique paginé. */
export function JournalAppelsModal({ isOpen, onOpenChange }: Props) {
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAppelsQuery(page, 15);

  const appels: IAppelLog[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-primary">Journal des appels</span>
              <span className="text-xs font-normal text-default-400">
                Historique des appels audio in-app (plus récents d&apos;abord).
              </span>
            </ModalHeader>
            <ModalBody className="pb-5">
              <Table
                aria-label="Journal des appels"
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
                        isDisabled={isFetching}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn className="text-primary">SENS</TableColumn>
                  <TableColumn className="text-primary">DE → VERS</TableColumn>
                  <TableColumn className="text-primary">STATUT</TableColumn>
                  <TableColumn className="text-primary">DURÉE</TableColumn>
                  <TableColumn className="text-primary">DATE</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={isLoading ? ' ' : 'Aucun appel'}
                  isLoading={isLoading}
                  loadingContent={<Spinner color="primary" label="Chargement…" />}
                >
                  {appels.map((a) => {
                    const s = sens(a.contexte);
                    const Icon = s.icon;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 ${s.color}`}>
                            <Icon className="h-4 w-4" />
                            {s.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium">{a.appelantNom || '—'}</span>
                          <span className="text-default-400"> → </span>
                          <span className="font-medium">
                            {a.appeleNom || a.appeleTelephone || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {a.statut ? (
                            <Chip color={STATUT_COLOR[a.statut]} variant="flat" size="sm">
                              {STATUT_LABEL[a.statut]}
                            </Chip>
                          ) : (
                            <span className="text-default-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-default-500">{formatDuree(a.dureeSec)}</TableCell>
                        <TableCell className="text-default-500">{formatInstant(a.declencheLe)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
