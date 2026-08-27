'use client';

import {
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { IAuditActionFiche } from '@/features/personnel/types/personnel-historisation.types';
import { formaterDateHeure } from '@/features/personnel/utils/personnel-historisation.utils';

interface Props {
  actions: IAuditActionFiche[] | undefined;
  chargement: boolean;
  erreur: unknown;
}

const COULEUR_ACTION: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
  CREATION: 'success',
  MODIFICATION: 'primary',
  SUPPRESSION: 'danger',
  EXPORT: 'warning',
  CONSULTATION_AUDIT: 'default',
};

function texteValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === '') return '∅';
  if (typeof valeur === 'object') return JSON.stringify(valeur);
  return String(valeur);
}

/** Les champs réellement modifiés, sous la forme « champ : avant → après ». */
function Diff({ action }: { action: IAuditActionFiche }) {
  const avant = action.valeursAvant ?? {};
  const apres = action.valeursApres ?? {};
  const champs = Array.from(new Set([...Object.keys(avant), ...Object.keys(apres)]));

  if (champs.length === 0) {
    return <span className="text-default-400">{action.entiteLibelle ?? '—'}</span>;
  }

  return (
    <div className="space-y-0.5">
      {champs.map((champ) => (
        <div key={champ} className="text-xs">
          <span className="font-medium text-default-600">{champ}</span>
          <span className="text-default-400"> : </span>
          <span className="text-default-500 line-through decoration-default-300">{texteValeur(avant[champ])}</span>
          <span className="text-default-400"> → </span>
          <span className="font-medium text-default-700">{texteValeur(apres[champ])}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Onglet « Historique des modifications » de la fiche : qui a fait quoi sur CE dossier.
 *
 * L'endpoint d'audit est gardé (Direction / Admin / Ops Manager). Un refus n'est pas une
 * panne : on le dit, on n'affiche pas d'erreur technique.
 */
export function HistoriqueModifications({ actions, chargement, erreur }: Props) {
  if (erreur) {
    const statut = (erreur as { response?: { status?: number } })?.response?.status;
    return (
      <p className="rounded-lg border border-default-200 bg-default-50 p-4 text-sm text-default-500">
        {statut === 403
          ? "La consultation de l'audit est réservée à la Direction, aux administrateurs et aux Ops Managers."
          : "L'historique des modifications n'a pas pu être chargé."}
      </p>
    );
  }

  return (
    <Table aria-label="Historique des modifications de la fiche" removeWrapper isStriped>
      <TableHeader>
        <TableColumn className="text-primary">QUAND</TableColumn>
        <TableColumn className="text-primary">QUI</TableColumn>
        <TableColumn className="text-primary">ACTION</TableColumn>
        <TableColumn className="text-primary">CE QUI A CHANGÉ</TableColumn>
      </TableHeader>
      <TableBody
        emptyContent={chargement ? ' ' : 'Aucune modification enregistrée sur cette fiche.'}
        isLoading={chargement}
        loadingContent={<Spinner color="primary" label="Chargement de l’historique…" />}
      >
        {(actions ?? []).map((a) => (
          <TableRow key={a.id}>
            <TableCell className="whitespace-nowrap text-default-500">{formaterDateHeure(a.occurredAt)}</TableCell>
            <TableCell>
              <div className="text-sm font-medium text-default-700">{a.utilisateur ?? 'Inconnu'}</div>
              {a.role ? <div className="text-[11px] text-default-400">{a.role}</div> : null}
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color={COULEUR_ACTION[a.typeAction ?? ''] ?? 'default'}>
                {a.typeAction ?? '—'}
              </Chip>
              {a.ecran ? <div className="mt-0.5 text-[11px] text-default-400">{a.ecran}</div> : null}
            </TableCell>
            <TableCell>
              <Diff action={a} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
