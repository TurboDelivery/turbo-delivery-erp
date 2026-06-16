'use client';

import { useState } from 'react';
import {
  Chip,
  Input,
  Pagination,
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

import {
  IJournalFiltre,
  ModuleActivite,
  MODULE_LABELS,
  useJournalQuery,
} from '@/features/reporting';

const MODULE_COLOR: Record<ModuleActivite, 'primary' | 'secondary' | 'warning' | 'success' | 'danger' | 'default'> = {
  COMPTE: 'primary',
  CRENEAU: 'secondary',
  POINTAGE: 'warning',
  GAIN: 'success',
  COMMUNICATION: 'danger',
  SUIVI: 'default',
};

const AUTEUR_COLOR: Record<string, 'primary' | 'secondary' | 'default'> = {
  AGENT: 'primary',
  LIVREUR: 'secondary',
  SYSTEME: 'default',
};

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const MODULES = Object.keys(MODULE_LABELS) as ModuleActivite[];

export function JournalPanel() {
  const [filtre, setFiltre] = useState<IJournalFiltre>({
    module: [],
    debut: null,
    fin: null,
    keysearch: '',
    page: 0,
  });

  const { data, isLoading, isFetching } = useJournalQuery(filtre);
  const lignes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const patch = (p: Partial<IJournalFiltre>) => setFiltre((f) => ({ ...f, ...p, page: 0 }));

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Filtrer par module"
          label="Modules"
          size="sm"
          selectionMode="multiple"
          className="w-60"
          selectedKeys={new Set(filtre.module)}
          onSelectionChange={(keys) => patch({ module: Array.from(keys) as ModuleActivite[] })}
        >
          {MODULES.map((m) => (
            <SelectItem key={m} value={m}>
              {MODULE_LABELS[m]}
            </SelectItem>
          ))}
        </Select>
        <Input
          type="date"
          label="Du"
          size="sm"
          className="w-40"
          value={filtre.debut ?? ''}
          onValueChange={(v) => patch({ debut: v || null })}
        />
        <Input
          type="date"
          label="Au"
          size="sm"
          className="w-40"
          value={filtre.fin ?? ''}
          onValueChange={(v) => patch({ fin: v || null })}
        />
        <Input
          label="Recherche"
          size="sm"
          placeholder="Libellé ou auteur…"
          className="min-w-[12rem] flex-1"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={filtre.keysearch}
          onValueChange={(v) => patch({ keysearch: v })}
        />
      </div>

      {/* Table */}
      <Table
        aria-label="Journal d'activité"
        isStriped
        bottomContent={
          totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPages}
                page={filtre.page + 1}
                onChange={(p) => setFiltre((f) => ({ ...f, page: p - 1 }))}
                color="primary"
                showControls
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn className="text-primary">DATE</TableColumn>
          <TableColumn className="text-primary">MODULE</TableColumn>
          <TableColumn className="text-primary">ACTION</TableColumn>
          <TableColumn className="text-primary">DÉTAIL</TableColumn>
          <TableColumn className="text-primary">AUTEUR</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucune activité'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement du journal…" />}
        >
          {lignes.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="whitespace-nowrap text-default-500">{formatInstant(l.occurredAt)}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={MODULE_COLOR[l.module] ?? 'default'}>
                  {MODULE_LABELS[l.module] ?? l.module}
                </Chip>
              </TableCell>
              <TableCell className="text-default-600">{l.action}</TableCell>
              <TableCell className="max-w-md truncate" title={l.libelle}>
                {l.libelle}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Chip size="sm" variant="dot" color={AUTEUR_COLOR[l.auteurType] ?? 'default'}>
                    {l.auteurNom ?? '—'}
                  </Chip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
