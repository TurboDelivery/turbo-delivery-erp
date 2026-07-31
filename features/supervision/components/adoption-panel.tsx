'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chip,
  Input,
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
import { AlertTriangle, Search } from 'lucide-react';

import { toast } from 'sonner';

import { useAdoptionQuery } from '../queries/supervision.queries';
import { ExporteurOnglet } from '../types';
import { exporterAdoption } from '../utils/supervision-export.utils';
import { formatInstant, initiales } from '../utils/supervision-format.utils';

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

  const { data, isLoading, isFetching } = useAdoptionQuery(userId, filtre === 'JAMAIS');

  const comptes = useMemo(() => {
    const liste = data?.comptes ?? [];
    const q = recherche.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter((compte) =>
      [compte.utilisateur, compte.identifiant, compte.role]
        .filter(Boolean)
        .some((valeur) => String(valeur).toLowerCase().includes(q)),
    );
  }, [data, recherche]);

  const exporter = useCallback(() => {
    const n = exporterAdoption(comptes);
    if (n === 0) toast.info('Aucun compte à exporter.');
    else toast.success(`${n} compte${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}.`);
  }, [comptes]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  return (
    <div className="space-y-4">
      {/* L'annuaire ERP est la seule source des comptes JAMAIS connectés : s'il est
          injoignable, un « 0 jamais connecté » serait un contresens, on le dit. */}
      {data && !data.annuaireDisponible && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-700 dark:bg-warning-50/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Annuaire des comptes ERP injoignable : cette liste ne contient que les comptes ayant déjà laissé une
            trace de connexion. Les comptes <strong>jamais connectés</strong> n&apos;y figurent donc pas — le
            chiffre d&apos;adoption est incomplet tant que l&apos;annuaire n&apos;a pas répondu.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Filtrer les comptes"
          label="Filtre"
          size="sm"
          className="w-56"
          selectedKeys={[filtre]}
          onSelectionChange={(cles) => setFiltre((Array.from(cles)[0] as string) ?? 'TOUS')}
        >
          <SelectItem key="TOUS">Tous les comptes</SelectItem>
          <SelectItem key="JAMAIS">Jamais connectés</SelectItem>
        </Select>
        <Input
          aria-label="Rechercher un compte"
          label="Recherche"
          size="sm"
          placeholder="Utilisateur, identifiant, rôle…"
          className="min-w-[14rem] flex-1"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={recherche}
          onValueChange={setRecherche}
          isClearable
          onClear={() => setRecherche('')}
        />
        <p className="pb-1 text-[11px] text-default-400">
          Champ figé à la première connexion réussie — non modifiable
        </p>
      </div>

      <Table aria-label="Premières connexions" isStriped removeWrapper>
        <TableHeader>
          <TableColumn className="text-primary">UTILISATEUR</TableColumn>
          <TableColumn className="text-primary">RÔLE</TableColumn>
          <TableColumn className="text-primary">PREMIÈRE CONNEXION</TableColumn>
          <TableColumn className="text-primary">DERNIÈRE CONNEXION</TableColumn>
          <TableColumn className="text-primary">CONNEXIONS</TableColumn>
          <TableColumn className="text-primary">STATUT D&apos;ADOPTION</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucun compte ne correspond aux filtres.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement de l’adoption…" />}
        >
          {comptes.map((compte, index) => (
            // Un compte de l'annuaire peut n'avoir ni identifiant ni id résolu :
            // l'index complète la clé plutôt que de risquer un doublon React.
            <TableRow key={compte.utilisateurId ?? compte.identifiant ?? `compte-${index}`}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-default-100 text-[11px] font-semibold text-default-600">
                    {initiales(compte.utilisateur ?? compte.identifiant)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{compte.utilisateur ?? 'Compte sans nom'}</p>
                    {compte.identifiant && (
                      <p className="truncate text-[11px] text-default-400">{compte.identifiant}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-default-500">{compte.role ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-default-500">
                {compte.premiereConnexionAt ? formatInstant(compte.premiereConnexionAt) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-default-500">
                {compte.derniereConnexionAt ? formatInstant(compte.derniereConnexionAt) : '—'}
              </TableCell>
              <TableCell className="tabular-nums text-default-500">{compte.nbConnexions ?? 0}</TableCell>
              <TableCell>
                <Chip size="sm" variant="dot" color={compte.jamaisConnecte ? 'default' : 'success'}>
                  {compte.jamaisConnecte ? 'Jamais connecté' : 'Adopté'}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-default-400">
        <span>
          {comptes.length} compte{comptes.length > 1 ? 's' : ''} affiché{comptes.length > 1 ? 's' : ''}
          {data ? ` · ${data.jamaisConnectes} jamais connecté${data.jamaisConnectes > 1 ? 's' : ''}` : ''}
        </span>
        <span>Un compte jamais connecté = formation à prévoir ou process hors système</span>
      </div>
    </div>
  );
}
