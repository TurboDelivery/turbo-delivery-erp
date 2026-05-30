'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Button, Chip, Switch } from '@heroui/react';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';
import { IChargeFixe, CyclePaiement } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';

/**
 * Cartes mobiles des tableaux Charges (cf. wrapper `hidden md:block` /
 * `md:hidden` dans ChargesTableV2). Réutilisent EXACTEMENT les mêmes données,
 * formatages et handlers que les colonnes (`charges-fixes-v2.columns`,
 * `depenses-variables-v2.columns`) pour éviter toute divergence desktop/mobile.
 */

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
};

const VARIABLE_STATUT_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'default' }> = {
  EN_ATTENTE_DGA: { label: 'En attente', color: 'warning' },
  VALIDE_DGA: { label: 'Validé DGA', color: 'primary' },
  REJETE_DGA: { label: 'Rejeté', color: 'danger' },
  APPROUVE_DG: { label: 'Approuvé', color: 'success' },
  REJETE_DG: { label: 'Rejeté', color: 'danger' },
  DECAISSE: { label: 'Décaissé', color: 'success' },
};

function CardShell({
  title,
  badge,
  rows,
  actions,
  className,
}: {
  title: string;
  badge?: ReactNode;
  rows: { label: string; value: ReactNode }[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">{title}</p>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      {rows
        .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
        .map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 shrink-0">{r.label}</span>
            <span className="text-sm text-gray-700 text-right break-words">{r.value}</span>
          </div>
        ))}
      {actions}
    </div>
  );
}

export function ChargeFixeMobileCard({
  charge,
  onEdit,
  onDelete,
  onToggle,
}: {
  charge: IChargeFixe;
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
  onToggle?: (charge: IChargeFixe, enabled: boolean) => void;
}) {
  return (
    <CardShell
      title={charge.designation}
      className={charge.automatique ? 'bg-green-50 border-green-100' : ''}
      badge={
        charge.automatique ? (
          <span className="text-xs text-green-600 font-medium">Automatique</span>
        ) : (
          <Switch size="sm" isSelected={charge.enable} onValueChange={(enabled) => onToggle?.(charge, enabled)} />
        )
      }
      rows={[
        { label: 'Catégorie', value: charge.categorie?.nomCategorie ?? '—' },
        { label: 'Cycle', value: CYCLE_LABELS[charge.cyclePaiement] ?? charge.cyclePaiement },
        { label: 'Montant', value: <span className="font-medium text-gray-900">{formatCFA(charge.montant)}</span> },
        { label: 'Taux journalier', value: formatCFA(Math.round(charge.montant / 30)) },
        { label: 'Consommé', value: <span className="font-medium text-orange-500">{formatCFA(charge.montantConsomme)}</span> },
        { label: 'Échéance', value: format(charge.dateEcheance, 'dd/MM/yyyy') },
      ]}
      actions={
        !charge.automatique ? (
          <div className="pt-1 flex gap-2">
            <Can I="update" a="ChargeFixe">
              <Button size="sm" variant="flat" className="flex-1 gap-1.5" onPress={() => onEdit?.(charge)}>
                <Edit size={15} /> Modifier
              </Button>
            </Can>
            <Can I="delete" a="ChargeFixe">
              <Button size="sm" color="danger" variant="flat" className="flex-1 gap-1.5" onPress={() => onDelete?.(charge)}>
                <Trash2 size={15} /> Supprimer
              </Button>
            </Can>
          </div>
        ) : undefined
      }
    />
  );
}

export function ChargeVariableMobileCard({
  charge,
  onEdit,
  onViewJustificatif,
}: {
  charge: IChargeVariable;
  onEdit?: (charge: IChargeVariable) => void;
  onViewJustificatif?: (url: string) => void;
}) {
  const config = VARIABLE_STATUT_CONFIG[charge.statut] ?? { label: charge.statut, color: 'default' as const };
  const justificatifUrl = charge.justificatif ? createUrlFile(charge.justificatif, 'backend') : null;
  const isEnAttente = charge.statut === 'EN_ATTENTE_DGA';

  return (
    <CardShell
      title={charge.designation}
      badge={
        <Chip color={config.color} variant="flat" size="sm">
          {config.label}
        </Chip>
      }
      rows={[
        { label: 'Catégorie', value: charge.categorie?.nomCategorie ?? '—' },
        { label: 'Montant', value: <span className="font-medium text-gray-900">{formatCFA(charge.montant)}</span> },
        { label: 'Date', value: charge.dateDepense ?? '—' },
        { label: 'Ajouté le', value: new Date(charge.createdAt).toLocaleDateString('fr-FR') },
        {
          label: 'Justificatif',
          value: justificatifUrl ? (
            <button className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700" onClick={() => onViewJustificatif?.(justificatifUrl)}>
              <Eye size={14} /> Voir
            </button>
          ) : (
            '—'
          ),
        },
      ]}
      actions={
        isEnAttente ? (
          <div className="pt-1">
            <Can I="valider-dga" a="ChargeVariable">
              <Button size="sm" variant="flat" className="w-full gap-1.5" onPress={() => onEdit?.(charge)}>
                <Edit size={15} className="text-gray-500" /> Modifier
              </Button>
            </Can>
          </div>
        ) : undefined
      }
    />
  );
}
