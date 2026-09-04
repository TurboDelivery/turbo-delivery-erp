'use client';

import React from 'react';
import { Button, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { Trash2 } from 'lucide-react';

import { IJourProgramme, IProgramme } from '@/features/turboys/types/programme.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

// Vocabulaire de la maquette M2 (le workflow backend reste BROUILLON → PLANIFIE
// → NOTIFIE → ACCEPTE / REFUSE).
const STATUT_UI: Record<string, { label: string; color: ChipColor }> = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  PLANIFIE: { label: 'Planifié', color: 'secondary' },
  NOTIFIE: { label: 'Publié', color: 'warning' },
  ACCEPTE: { label: 'Accepté', color: 'success' },
  REFUSE: { label: 'Refusé', color: 'danger' },
};

const JOURS = [
  { key: 'LUNDI', label: 'Lun' },
  { key: 'MARDI', label: 'Mar' },
  { key: 'MERCREDI', label: 'Mer' },
  { key: 'JEUDI', label: 'Jeu' },
  { key: 'VENDREDI', label: 'Ven' },
  { key: 'SAMEDI', label: 'Sam' },
  { key: 'DIMANCHE', label: 'Dim' },
];

// Colonnes de la grille = Livreur + 7 jours + Statut + Actions. Un seul tableau
// mappé pour l'en-tête ET les cellules (pattern React-Aria du codebase).
const COLONNES = [
  { key: 'livreur', label: 'Livreur', center: false },
  { key: 'poste', label: 'Poste / Site', center: false },
  ...JOURS.map((j) => ({ key: j.key, label: j.label, center: true })),
  { key: 'statut', label: 'Statut', center: true },
  { key: 'actions', label: ' ', center: false },
];

/** Partenaires distincts desservis sur la semaine (toutes journées). */
function postesSemaine(p: IProgramme): string[] {
  return Array.from(
    new Set(
      (p.jours ?? []).flatMap((j) => (j.postes ?? []).map((po) => po.restaurantNom).filter((n): n is string => !!n)),
    ),
  );
}

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

function CelluleJour({ jour }: { jour?: IJourProgramme }) {
  if (!jour || !jour.actif) {
    return (
      <div className="rounded-md bg-danger-50 px-2 py-1 text-center text-[11px] font-semibold text-danger-500">
        REPOS
      </div>
    );
  }
  return (
    <div className="rounded-md bg-success-50 px-2 py-1 text-center leading-tight">
      <div className="text-xs font-semibold text-success-700">↑ {hhmm(jour.debut)}</div>
      <div className="text-[11px] text-default-500">↓ {hhmm(jour.fin)}</div>
    </div>
  );
}

export interface ProgrammeGridHandlers {
  onApercu?: (p: IProgramme) => void;
  onEdit?: (p: IProgramme) => void;
  onPlanifier?: (p: IProgramme) => void;
  onPublier?: (p: IProgramme) => void;
  onDelete?: (p: IProgramme) => void;
  pendingId?: string | null;
}

function LigneActions({ p, h }: { p: IProgramme; h: ProgrammeGridHandlers }) {
  const s = p.statut;
  const busy = h.pendingId === p.id;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button size="sm" variant="light" onPress={() => h.onApercu?.(p)}>
        Aperçu
      </Button>
      {/* Éditer disponible sur TOUS les statuts : modifier un programme confirmé
          le renvoie au livreur pour une nouvelle acceptation (re-notification). */}
      {h.onEdit && (
        <Button size="sm" variant="flat" onPress={() => h.onEdit?.(p)} isDisabled={busy}>
          Éditer
        </Button>
      )}
      {s === 'BROUILLON' && (
        <Button size="sm" variant="flat" color="secondary" onPress={() => h.onPlanifier?.(p)} isLoading={busy}>
          Planifier
        </Button>
      )}
      {(s === 'BROUILLON' || s === 'PLANIFIE') && (
        <Button size="sm" color="primary" onPress={() => h.onPublier?.(p)} isLoading={busy}>
          Publier
        </Button>
      )}
      {s === 'REFUSE' && p.motifRefus && (
        <span className="text-xs italic text-danger-soft-foreground" title={p.motifRefus}>
          Refusé
        </span>
      )}
      {/* Suppression : programme non engagé (le livreur ne l'a pas encore / l'a refusé). */}
      {(s === 'BROUILLON' || s === 'PLANIFIE' || s === 'REFUSE') && h.onDelete && (
        <Button
          size="sm"
          isIconOnly
          variant="light"
          color="danger"
          aria-label="Supprimer le programme"
          title="Supprimer le programme"
          isDisabled={busy}
          onPress={() => h.onDelete?.(p)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function renderCellule(p: IProgramme, colKey: string, h: ProgrammeGridHandlers): React.ReactNode {
  if (colKey === 'livreur') {
    return (
      <div className="min-w-[140px]">
        <div className="font-medium text-default-800">{p.livreurNom ?? '—'}</div>
        {p.typeLivreur && (
          <div className="text-xs text-default-400">{getTurboyTypeDisplay(p.typeLivreur).label}</div>
        )}
      </div>
    );
  }
  if (colKey === 'poste') {
    const noms = postesSemaine(p);
    return noms.length ? (
      <div className="min-w-[150px] max-w-[220px] text-xs text-default-600">{noms.join(' · ')}</div>
    ) : (
      <span className="text-xs text-default-300">—</span>
    );
  }
  if (colKey === 'statut') {
    const ui = STATUT_UI[p.statut ?? ''] ?? { label: p.statut ?? '—', color: 'default' as ChipColor };
    return (
      <Chip size="sm" variant="flat" color={ui.color}>
        {ui.label}
      </Chip>
    );
  }
  if (colKey === 'actions') {
    return <LigneActions p={p} h={h} />;
  }
  // Sinon c'est une colonne-jour (clé = LUNDI..DIMANCHE).
  return <CelluleJour jour={p.jours?.find((x) => (x.jour ?? '').toUpperCase() === colKey)} />;
}

interface Props extends ProgrammeGridHandlers {
  programmes: IProgramme[];
  emptyContent?: React.ReactNode;
  // Lecture seule (section Indépendants) : masque la colonne d'actions.
  readOnly?: boolean;
}

/**
 * Grille hebdomadaire 2D (maquette M2) : une ligne par livreur, une colonne par
 * jour avec montée ↑ / descente ↓ ou REPOS, + statut et actions de workflow.
 */
export function ProgrammesGrid({ programmes, emptyContent, readOnly, ...handlers }: Props) {
  const colonnes = readOnly ? COLONNES.filter((c) => c.key !== 'actions') : COLONNES;
  return (
    <div className="overflow-x-auto">
      <Table
        aria-label="Grille hebdomadaire des programmes"
        removeWrapper
        classNames={{
          th: 'bg-default-100 text-[11px] font-semibold uppercase tracking-wide text-default-600',
          td: 'align-middle',
        }}
      >
        <TableHeader>
          {colonnes.map((c) => (
            <TableColumn key={c.key} className={c.center ? 'text-center' : undefined}>
              {c.label}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={emptyContent ?? 'Aucun programme pour cette semaine'}>
          {programmes.map((p) => (
            <TableRow key={p.id}>
              {colonnes.map((c) => (
                <TableCell key={c.key} className={c.center ? 'px-1.5 text-center' : undefined}>
                  {renderCellule(p, c.key, handlers)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
