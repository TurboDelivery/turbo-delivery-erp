'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { AlertTriangle, CheckCircle2, ChevronDown, HandCoins, Stamp, Wallet, X, XCircle } from 'lucide-react';

import {
  useActionsGroupeesMutation,
  useAgentsRecouvrementQuery,
  type ActionGroupee,
  type IActionsGroupeesFiltres,
  type IActionsGroupeesRequest,
} from '@/features/responsable-financier';

interface ActionMeta {
  key: ActionGroupee;
  label: string;
  verbe: string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  besoin?: 'agent' | 'motif';
  hint: string;
}

const ACTIONS: ActionMeta[] = [
  { key: 'VALIDER', label: 'Valider les factures', verbe: 'Valider', icon: CheckCircle2, color: 'success', hint: 'Factures « À valider ».' },
  { key: 'RECOUVREMENT', label: 'Lancer le recouvrement', verbe: 'Lancer le recouvrement', icon: HandCoins, color: 'primary', besoin: 'agent', hint: 'Factures « Validé ».' },
  { key: 'VISER_DGA', label: 'Viser (DGA)', verbe: 'Viser', icon: Stamp, color: 'secondary', hint: 'Factures « En attente visa DGA ».' },
  { key: 'REJETER_DGA', label: 'Rejeter (DGA)', verbe: 'Rejeter', icon: XCircle, color: 'danger', besoin: 'motif', hint: 'Factures « En attente visa DGA ».' },
  { key: 'CONFIRMER_RECEPTION', label: 'Confirmer la réception', verbe: 'Confirmer la réception', icon: Wallet, color: 'warning', hint: 'Factures « Versé au caissier ».' },
];

export interface BulkActionsBarProps {
  /** IDs cochés explicitement (page courante). */
  selectedIds: string[];
  /** true = toutes les factures du filtre courant (toutes pages). */
  selectAllMatching: boolean;
  /** Nombre total de factures du filtre (pour l'affichage quand selectAllMatching). */
  totalElements: number;
  /** Filtres courants, transmis au backend quand selectAllMatching. */
  filtres: IActionsGroupeesFiltres;
  /** Vider la sélection. */
  onClear: () => void;
  /** Rafraîchissement post-action (invalidation déjà faite par la mutation). */
  onDone?: () => void;
}

export default function BulkActionsBar({
  selectedIds,
  selectAllMatching,
  totalElements,
  filtres,
  onClear,
  onDone,
}: BulkActionsBarProps) {
  const [action, setAction] = useState<ActionMeta | null>(null);
  const [agentId, setAgentId] = useState('');
  const [motif, setMotif] = useState('');

  const mutation = useActionsGroupeesMutation();
  const { data: agents } = useAgentsRecouvrementQuery();

  const cible = selectAllMatching ? totalElements : selectedIds.length;

  const ouvrir = (meta: ActionMeta) => {
    setAgentId('');
    setMotif('');
    setAction(meta);
  };

  const peutConfirmer = useMemo(() => {
    if (!action) return false;
    if (action.besoin === 'agent') return !!agentId;
    if (action.besoin === 'motif') return motif.trim().length > 0;
    return true;
  }, [action, agentId, motif]);

  const confirmer = () => {
    if (!action) return;
    const body: IActionsGroupeesRequest = selectAllMatching
      ? { action: action.key, selectAll: true, filtres }
      : { action: action.key, selectAll: false, ids: selectedIds };
    if (action.besoin === 'agent') body.agentId = agentId;
    if (action.besoin === 'motif') body.motif = motif.trim();

    mutation.mutate(body, {
      onSuccess: () => {
        setAction(null);
        onClear();
        onDone?.();
      },
    });
  };

  if (cible === 0) return null;

  return (
    <>
      {/* Barre flottante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white shadow-xl px-4 py-2.5">
        <button onClick={onClear} className="p-1 rounded-md hover:bg-gray-100 text-gray-400" aria-label="Vider la sélection">
          <X className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {selectAllMatching ? (
            <>Toutes les <b>{totalElements}</b> factures du filtre</>
          ) : (
            <><b>{selectedIds.length}</b> facture{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}</>
          )}
        </span>
        <Dropdown placement="top-end">
          <DropdownTrigger>
            <Button color="primary" size="sm" endContent={<ChevronDown className="w-4 h-4" />}>
              Actions groupées
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Actions groupées" onAction={(k) => {
            const meta = ACTIONS.find((a) => a.key === k);
            if (meta) ouvrir(meta);
          }}>
            {ACTIONS.map((a) => (
              <DropdownItem key={a.key} startContent={<a.icon className="w-4 h-4" />} description={a.hint}>
                {a.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Confirmation */}
      <Modal isOpen={!!action} onOpenChange={(o) => !o && setAction(null)} placement="center">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                {action && <action.icon className="w-5 h-5" />}
                {action?.verbe} — {cible} facture{cible > 1 ? 's' : ''}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-600">
                  {selectAllMatching ? (
                    <>L&apos;action <b>{action?.verbe}</b> va être appliquée à <b>toutes les {totalElements} factures</b> correspondant au filtre courant (toutes pages).</>
                  ) : (
                    <>L&apos;action <b>{action?.verbe}</b> va être appliquée aux <b>{selectedIds.length} factures</b> sélectionnées.</>
                  )}
                </p>

                {action?.besoin === 'agent' && (
                  <Select
                    label="Agent de recouvrement"
                    placeholder="Choisir un agent"
                    variant="bordered"
                    selectedKeys={agentId ? [agentId] : []}
                    onSelectionChange={(keys) => setAgentId(Array.from(keys as Set<string>)[0] ?? '')}
                    isRequired
                  >
                    {(agents ?? []).map((ag) => (
                      <SelectItem key={ag.id} textValue={ag.nom}>
                        {ag.nom} {ag.role ? <span className="text-gray-400">· {ag.role}</span> : null}
                      </SelectItem>
                    ))}
                  </Select>
                )}

                {action?.besoin === 'motif' && (
                  <Textarea
                    label="Motif du rejet"
                    placeholder="Expliquez le motif (obligatoire)"
                    variant="bordered"
                    value={motif}
                    onValueChange={setMotif}
                    isRequired
                    minRows={2}
                  />
                )}

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  Seules les factures dont le statut permet cette action seront modifiées. Les autres sont ignorées et un récapitulatif s&apos;affiche.
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={close} isDisabled={mutation.isPending}>
                  Annuler
                </Button>
                <Button color={action?.color ?? 'primary'} onPress={confirmer} isLoading={mutation.isPending} isDisabled={!peutConfirmer}>
                  Confirmer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
