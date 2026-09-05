'use client';

import React, { useMemo, useState } from 'react';
import { useAbility } from '@/hooks/use-ability';
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
} from '@/components/heroui';
import { AlertTriangle, ArrowLeftRight, CheckCircle2, ChevronDown, HandCoins, Landmark, PiggyBank, Wallet, X, XCircle } from 'lucide-react';

import {
  useActionsGroupeesMutation,
  useAgentsRecouvrementQuery,
  type ActionGroupee,
  type IActionsGroupeesFiltres,
  type IActionsGroupeesRequest,
} from '@/features/responsable-financier';
import EtatErreur from '@/components/commons/EtatErreur';

type UiActionKey = ActionGroupee | 'ORIENTER';

interface ActionMeta {
  key: UiActionKey;
  label: string;
  verbe: string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  besoin?: 'agent' | 'motif' | 'orientation';
  hint: string;
}

// Ordre = déroulé du workflow. 2026-07-27 : « Viser (DGA) » supprimé — décider de
// l'orientation VAUT visa (posé implicitement par le backend depuis « En attente visa DGA »).
const ACTIONS: ActionMeta[] = [
  { key: 'VALIDER', label: 'Valider les factures', verbe: 'Valider', icon: CheckCircle2, color: 'success', hint: 'Factures « À valider ».' },
  { key: 'RECOUVREMENT', label: 'Lancer le recouvrement', verbe: 'Lancer le recouvrement', icon: HandCoins, color: 'primary', besoin: 'agent', hint: 'Factures « Validé ».' },
  { key: 'CONFIRMER_RECEPTION', label: 'Confirmer la réception', verbe: 'Confirmer la réception', icon: Wallet, color: 'warning', hint: 'Factures « Versé au caissier ».' },
  { key: 'ORIENTER', label: 'Orientation des fonds', verbe: 'Orientation des fonds', icon: ArrowLeftRight, color: 'primary', besoin: 'orientation', hint: 'Factures « En attente visa DGA » : vise + oriente (banque ou caisse).' },
  { key: 'REJETER_DGA', label: 'Rejeter (DGA)', verbe: 'Rejeter', icon: XCircle, color: 'danger', besoin: 'motif', hint: 'Factures « En attente visa DGA ».' },
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
  const [orientation, setOrientation] = useState<'' | 'BANQUE' | 'CAISSE'>('');

  const mutation = useActionsGroupeesMutation();
  const {
    data: agents,
    isError: agentsEnErreur,
    isFetching: agentsEnCours,
    refetch: relancerAgents,
  } = useAgentsRecouvrementQuery();

  const cible = selectAllMatching ? totalElements : selectedIds.length;

  const ouvrir = (meta: ActionMeta) => {
    setAgentId('');
    setMotif('');
    setOrientation('');
    setAction(meta);
  };

  /*
   * L'ORIENTATION DES FONDS VAUT VISA DGA, ET N'ETAIT GARDEE PAR RIEN.
   *
   * <p>Le commentaire du fichier le dit lui-meme : decider de l'orientation POSE le visa
   * DGA implicitement. Or cet ecran n'exige que `read PageResponsableFinancier`, accorde
   * au comptable et au caissier. L'un d'eux pouvait cocher « toutes les factures du
   * filtre », choisir « Orientation des fonds », et viser puis affecter d'un coup tout le
   * stock — alors que l'ecran PREVU pour cette decision,
   * `/finance/comptabilite/orientation-fonds`, leur est ferme.</p>
   *
   * <p>On reprend donc exactement la garde de cet ecran-la : `read OrientationFonds`,
   * que seuls le DG (`manage all`) et le DGA (`read all`) detiennent.</p>
   */
  const ability = useAbility();
  const peutOrienter = ability.can('read', 'OrientationFonds');
  const actionsDisponibles = useMemo(
    () => ACTIONS.filter((a) => (a.key === 'ORIENTER' || a.key === 'REJETER_DGA' ? peutOrienter : true)),
    [peutOrienter],
  );

  const peutConfirmer = useMemo(() => {
    if (!action) return false;
    if (action.besoin === 'agent') return !!agentId;
    if (action.besoin === 'motif') return motif.trim().length > 0;
    if (action.besoin === 'orientation') {
      if (orientation === 'BANQUE') return true;
      if (orientation === 'CAISSE') return motif.trim().length >= 30;
      return false;
    }
    return true;
  }, [action, agentId, motif, orientation]);

  const confirmer = () => {
    if (!action) return;
    // Le GESTE est garde, pas seulement son entree de menu : une action retiree de la
    // liste ne doit pas pouvoir partir par un autre chemin.
    if ((action.key === 'ORIENTER' || action.key === 'REJETER_DGA') && !peutOrienter) return;
    // Une seule entrée « Orientation des fonds » → on dérive l'action réelle du choix banque/caisse.
    const key: ActionGroupee =
      action.besoin === 'orientation'
        ? orientation === 'BANQUE'
          ? 'ORIENTER_BANQUE'
          : 'ORIENTER_CAISSE'
        : (action.key as ActionGroupee);
    const body: IActionsGroupeesRequest = selectAllMatching
      ? { action: key, selectAll: true, filtres }
      : { action: key, selectAll: false, ids: selectedIds };
    if (action.besoin === 'agent') body.agentId = agentId;
    if (action.besoin === 'motif') body.motif = motif.trim();
    if (action.besoin === 'orientation' && orientation === 'CAISSE') body.motif = motif.trim();

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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-separator bg-surface shadow-xl px-4 py-2.5">
        <button onClick={onClear} className="p-1 rounded-md hover:bg-surface-secondary text-muted" aria-label="Vider la sélection">
          <X className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">
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
            const meta = actionsDisponibles.find((a) => a.key === k);
            if (meta) ouvrir(meta);
          }}>
            {actionsDisponibles.map((a) => (
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
                <p className="text-sm text-muted">
                  {selectAllMatching ? (
                    <>L&apos;action <b>{action?.verbe}</b> va être appliquée à <b>toutes les {totalElements} factures</b> correspondant au filtre courant (toutes pages).</>
                  ) : (
                    <>L&apos;action <b>{action?.verbe}</b> va être appliquée aux <b>{selectedIds.length} factures</b> sélectionnées.</>
                  )}
                </p>

                {/* liste d'agents en echec : le select restait vide, comme si aucun agent n'existait */}
                {action?.besoin === 'agent' && agentsEnErreur && (
                  <EtatErreur
                    quoi="les agents de recouvrement"
                    onReessayer={() => relancerAgents()}
                    enCours={agentsEnCours}
                  />
                )}

                {action?.besoin === 'agent' && !agentsEnErreur && (
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
                        {ag.nom} {ag.role ? <span className="text-muted">· {ag.role}</span> : null}
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

                {action?.besoin === 'orientation' && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted">Décision d&apos;orientation des fonds :</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrientation('BANQUE')}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition ${
                          orientation === 'BANQUE' ? 'border-primary bg-primary/5' : 'border-separator hover:border-separator'
                        }`}
                      >
                        <Landmark className={`w-6 h-6 ${orientation === 'BANQUE' ? 'text-primary' : 'text-muted'}`} />
                        <span className="text-sm font-semibold text-foreground">Dépôt en banque</span>
                        <span className="text-[11px] text-muted">Débloque le dépôt du Comptable</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation('CAISSE')}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition ${
                          orientation === 'CAISSE' ? 'border-warning bg-warning/5' : 'border-separator hover:border-separator'
                        }`}
                      >
                        <PiggyBank className={`w-6 h-6 ${orientation === 'CAISSE' ? 'text-warning-soft-foreground' : 'text-muted'}`} />
                        <span className="text-sm font-semibold text-foreground">Conserver en caisse</span>
                        <span className="text-[11px] text-muted">Fonds de roulement · motif requis</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-muted">
                      Le visa DGA est posé automatiquement (auteur, date, N° de visa) au moment de la décision.
                    </p>
                    {orientation === 'CAISSE' && (
                      <Textarea
                        label="Motif de conservation en caisse"
                        placeholder="Expliquez pourquoi les fonds sont conservés (min. 30 caractères)"
                        variant="bordered"
                        value={motif}
                        onValueChange={setMotif}
                        isRequired
                        minRows={2}
                        color={motif.trim().length > 0 && motif.trim().length < 30 ? 'warning' : 'default'}
                        description={`${motif.trim().length}/30 caractères minimum`}
                      />
                    )}
                  </div>
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
