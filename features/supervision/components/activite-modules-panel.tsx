'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tooltip,
} from '@heroui/react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { useAuditActionsQuery, useModulesAuditQuery } from '../queries/supervision.queries';
import { useRechercheDifferee } from '../hooks/use-recherche-differee';
import {
  ExporteurOnglet,
  IActionsFiltre,
  TYPE_ACTION_COULEURS,
  TYPE_ACTION_LABELS,
  TYPES_ACTION,
} from '../types';
import { exporterActions, messageTroncature } from '../utils/supervision-export.utils';
import { formatHeure, formatInstant, libelleObjet } from '../utils/supervision-format.utils';
import { DiffValeurs } from './diff-valeurs';

const TAILLE_PAGE = 25;

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
  const { data, isLoading, isFetching } = useAuditActionsQuery(userId, filtre, TAILLE_PAGE);

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
        <Select
          aria-label="Filtrer par module"
          label="Module"
          size="sm"
          className="w-52"
          selectedKeys={[module]}
          onSelectionChange={(cles) => setModule((Array.from(cles)[0] as string) ?? 'TOUS')}
        >
          {[
            <SelectItem key="TOUS">Tous les modules</SelectItem>,
            ...(modules ?? []).map((nom) => <SelectItem key={nom}>{nom}</SelectItem>),
          ]}
        </Select>
        <Select
          aria-label="Filtrer par type d'action"
          label="Action"
          size="sm"
          className="w-56"
          selectedKeys={[typeAction]}
          onSelectionChange={(cles) => setTypeAction((Array.from(cles)[0] as string) ?? 'TOUS')}
        >
          {[
            <SelectItem key="TOUS">Toutes</SelectItem>,
            ...TYPES_ACTION.map((type) => <SelectItem key={type}>{TYPE_ACTION_LABELS[type]}</SelectItem>),
          ]}
        </Select>
        <Input
          type="date"
          label="Du"
          aria-label="Date de début"
          size="sm"
          className="w-40"
          value={depuis}
          onValueChange={setDepuis}
        />
        <Input
          type="date"
          label="Au"
          aria-label="Date de fin"
          size="sm"
          className="w-40"
          value={jusqua}
          onValueChange={setJusqua}
        />
        <Input
          aria-label="Rechercher dans le journal des actions"
          label="Recherche"
          size="sm"
          placeholder="Utilisateur, objet, référence…"
          className="min-w-[14rem] flex-1"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={saisie}
          onValueChange={setSaisie}
          isClearable
          onClear={() => setSaisie('')}
        />
      </div>

      <Table
        aria-label="Journal des actions métier"
        isStriped
        removeWrapper
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
          <TableColumn className="text-primary">HEURE</TableColumn>
          <TableColumn className="text-primary">UTILISATEUR</TableColumn>
          <TableColumn className="text-primary">MODULE</TableColumn>
          <TableColumn className="text-primary">ACTION</TableColumn>
          <TableColumn className="text-primary">OBJET CONCERNÉ</TableColumn>
          <TableColumn className="text-primary">DÉTAIL (AVANT → APRÈS)</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucune action pour ces critères.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement du journal…" />}
        >
          {lignes.map((action) => (
            <TableRow key={action.id}>
              <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-default-500">
                <Tooltip content={formatInstant(action.occurredAt)} size="sm">
                  <span>{formatHeure(action.occurredAt)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium">{action.utilisateur ?? 'Système'}</p>
                {action.role && <p className="text-[11px] text-default-400">{action.role}</p>}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" className="text-[11px]">
                  {action.module ?? '—'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="dot" color={TYPE_ACTION_COULEURS[action.typeAction] ?? 'default'}>
                  {TYPE_ACTION_LABELS[action.typeAction] ?? action.typeAction}
                </Chip>
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium">{libelleObjet(action)}</p>
                {action.entiteId && (
                  <p className="truncate text-[11px] text-default-400" title={action.entiteId}>
                    {action.entiteId}
                  </p>
                )}
              </TableCell>
              <TableCell className="max-w-sm">
                <DiffValeurs action={action} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-default-400">
        <span>
          {total} action{total > 1 ? 's' : ''} pour ces critères
        </span>
        <span>
          Audit central — toute écriture, dans tout module, est journalisée · lecture seule · rétention 24 mois
        </span>
      </div>
    </div>
  );
}
