'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
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
import { ArrowRight, Download } from 'lucide-react';

import { useAnomaliesQuery } from '@/features/personnel/queries/personnel-historisation.query';
import {
  LIBELLE_GRAVITE,
  formaterDateHeure,
  telechargerCsv,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { AgentCell } from './shared/agent-cell';
import { GraviteChip } from './shared/personnel-chips';

const TOUS = '__TOUS__';

/**
 * Onglet « Anomalies » (F6).
 *
 * Les anomalies ne sont jamais stockées : le backend les recalcule à chaque appel. Le filtre
 * accepte indifféremment un code d'anomalie ou une gravité — c'est le même paramètre côté
 * serveur, on lui passe donc directement la clé choisie.
 */
export function AnomaliesTab() {
  const [type, setType] = useState<string>('');
  const { data, isLoading, isFetching } = useAnomaliesQuery(type || null);

  const options = useMemo(() => {
    const catalogue = data?.typesDisponibles ?? [];
    return [
      { cle: TOUS, libelle: 'Toutes' },
      ...catalogue.map((t) => ({
        cle: t.code,
        libelle: `${t.libelle} (${LIBELLE_GRAVITE[t.gravite] ?? t.gravite})`,
      })),
    ];
  }, [data?.typesDisponibles]);

  const anomalies = data?.anomalies ?? [];

  const exporter = () => {
    telechargerCsv(
      'anomalies_personnel',
      ['gravite', 'anomalie', 'agent', 'matricule', 'detail'],
      anomalies.map((a) => [
        LIBELLE_GRAVITE[a.gravite] ?? a.gravite,
        a.libelle,
        a.employeNom ?? '',
        a.matricule ?? '',
        a.detail ?? '',
      ]),
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-default-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          label="Type d'anomalie"
          size="sm"
          className="w-80"
          selectedKeys={new Set([type || TOUS])}
          onSelectionChange={(keys) => {
            const cle = Array.from(keys as Set<string>)[0];
            setType(!cle || cle === TOUS ? '' : cle);
          }}
        >
          {options.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Download className="h-4 w-4" />}
          onPress={exporter}
          isDisabled={anomalies.length === 0}
        >
          Exporter CSV
        </Button>
      </div>

      <Table aria-label="Anomalies du personnel" removeWrapper isStriped>
        <TableHeader>
          <TableColumn className="text-primary">GRAVITÉ</TableColumn>
          <TableColumn className="text-primary">ANOMALIE</TableColumn>
          <TableColumn className="text-primary">AGENT CONCERNÉ</TableColumn>
          <TableColumn className="text-primary">DÉTAIL</TableColumn>
          <TableColumn className="text-right text-primary"> </TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucune anomalie — profils conformes.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Analyse des dossiers…" />}
        >
          {anomalies.map((a, index) => (
            <TableRow key={`${a.type}-${a.employeId ?? 'na'}-${index}`}>
              <TableCell>
                <GraviteChip gravite={a.gravite} />
              </TableCell>
              <TableCell className="font-medium text-default-700">{a.libelle}</TableCell>
              <TableCell>
                <AgentCell
                  nom={a.employeNom}
                  matricule={a.matricule}
                  employeId={a.employeId}
                  sousTitre={a.typeLibelle}
                />
              </TableCell>
              <TableCell className="max-w-md text-default-500">{a.detail ?? '—'}</TableCell>
              <TableCell className="text-right">
                {a.employeId ? (
                  <Link
                    href={`/personnel/${a.employeId}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                  >
                    Corriger
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-100 pt-3 text-xs text-default-400">
        <span>
          {anomalies.length} anomalie(s) affichée(s) sur {data?.total ?? 0} · {data?.employesAnalyses ?? 0} dossier(s)
          analysé(s)
        </span>
        <span>
          {data?.calculeLe ? `Recalculé le ${formaterDateHeure(data.calculeLe)}` : 'Recalcul automatique'} — objectif
          zéro anomalie avant chaque clôture
        </span>
      </div>
    </div>
  );
}
