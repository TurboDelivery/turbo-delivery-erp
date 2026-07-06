'use client';

import { useMemo, useState } from 'react';
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
  Tab,
  Tabs,
} from '@heroui/react';
import { AlertTriangle, Camera, Phone, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useAbility } from '@/hooks/use-ability';
import {
  IIncident,
  StatutIncident,
  useIncidentsOuvertsQuery,
  useIncidentsQuery,
} from '@/features/standard';
import { IncidentStatutChip } from './incident-statut-chip';
import { IncidentDetailModal } from './incident-detail-modal';
import { MotifsAdminModal } from './motifs-admin-modal';
import { AppelRapideModal } from './appel-rapide-modal';

type FiltreStatut = 'TOUS' | StatutIncident;

const FILTRES: { key: FiltreStatut; label: string }[] = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'RECU', label: 'Reçus' },
  { key: 'EN_COURS', label: 'En cours' },
  { key: 'TRAITE', label: 'Traités' },
  { key: 'CLOTURE', label: 'Clôturés' },
];

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

export function StandardControlCenter() {
  const ability = useAbility();
  const canRead = ability.can('read', 'Incident');
  const canUpdate = ability.can('update', 'Incident');

  const [filtre, setFiltre] = useState<FiltreStatut>('TOUS');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<IIncident | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [motifsOpen, setMotifsOpen] = useState(false);
  const [appelOpen, setAppelOpen] = useState(false);

  const statut = filtre === 'TOUS' ? undefined : filtre;
  const { data, isLoading, isFetching, refetch } = useIncidentsQuery(statut, page);
  const { data: ouverts } = useIncidentsOuvertsQuery();

  const incidents = useMemo(() => data?.content ?? [], [data?.content]);
  const totalPages = data?.totalPages ?? 0;

  const parId = useMemo(() => {
    const m = new Map<string, IIncident>();
    incidents.forEach((i) => m.set(i.id, i));
    return m;
  }, [incidents]);

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès au centre de contrôle STANDARD.</p>
      </div>
    );
  }

  const onChangeFiltre = (key: FiltreStatut) => {
    setFiltre(key);
    setPage(0);
  };

  const ouvrirDetail = (id: string) => {
    const inc = parId.get(id);
    if (inc) {
      setSelected(inc);
      setDetailOpen(true);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
            Centre de contrôle — STANDARD
            {(ouverts?.ouverts ?? 0) > 0 && (
              <Chip color="danger" variant="flat" size="sm">
                {ouverts?.ouverts} ouvert{(ouverts?.ouverts ?? 0) > 1 ? 's' : ''}
              </Chip>
            )}
          </h1>
          <p className="text-sm text-default-500">
            Signalements d&apos;incidents des livreurs en temps réel — suivi par statut (CDC RG-24).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="success"
            variant="flat"
            startContent={<Phone className="h-4 w-4" />}
            onPress={() => setAppelOpen(true)}
          >
            Appeler un livreur
          </Button>
          <Button
            variant="flat"
            startContent={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
            onPress={() => refetch()}
          >
            Actualiser
          </Button>
          {canUpdate && (
            <Button
              color="primary"
              variant="flat"
              startContent={<SlidersHorizontal className="h-4 w-4" />}
              onPress={() => setMotifsOpen(true)}
            >
              Motifs
            </Button>
          )}
        </div>
      </div>

      {/* Filtre par statut */}
      <Tabs
        aria-label="Filtrer par statut"
        selectedKey={filtre}
        onSelectionChange={(k) => onChangeFiltre(k as FiltreStatut)}
        color="primary"
        variant="bordered"
      >
        {FILTRES.map((f) => (
          <Tab key={f.key} title={f.label} />
        ))}
      </Tabs>

      {/* File des incidents */}
      <Table
        aria-label="File des incidents"
        isStriped
        onRowAction={(key) => ouvrirDetail(String(key))}
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
          <TableColumn className="text-primary">STATUT</TableColumn>
          <TableColumn className="text-primary">MOTIF</TableColumn>
          <TableColumn className="text-primary">LIVREUR</TableColumn>
          <TableColumn className="text-primary">SIGNALÉ LE</TableColumn>
          <TableColumn className="text-primary">PREUVE</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? ' ' : 'Aucun incident'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement des incidents…" />}
        >
          {incidents.map((inc) => (
            <TableRow key={inc.id} className="cursor-pointer">
              <TableCell>
                <IncidentStatutChip statut={inc.statut} />
              </TableCell>
              <TableCell className="font-medium">{inc.motifLibelle}</TableCell>
              <TableCell>{inc.livreurNom ?? <span className="text-default-400">—</span>}</TableCell>
              <TableCell className="text-default-500">{formatInstant(inc.signaleLe)}</TableCell>
              <TableCell>
                {inc.preuveUrl ? (
                  <Camera className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-default-300">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <IncidentDetailModal
        incident={selected}
        isOpen={detailOpen}
        onOpenChange={setDetailOpen}
        canUpdate={canUpdate}
      />
      <MotifsAdminModal isOpen={motifsOpen} onOpenChange={setMotifsOpen} />
      <AppelRapideModal isOpen={appelOpen} onOpenChange={setAppelOpen} />
    </div>
  );
}
