'use client';

import {
    Button,
    Card,
    ComboBox,
    Dropdown,
    Input,
    Label,
    ListBox,
    Modal,
    Radio,
    RadioGroup,
    TextArea,
} from '@heroui-v3/react';
import {
    AlertTriangle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronDown,
    HandCoins,
    Landmark,
    PiggyBank,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
    type ActionGroupee,
    type IActionsGroupeesFiltres,
    type IActionsGroupeesRequest,
    useActionsGroupeesMutation,
    useAgentsRecouvrementQuery,
} from '@/features/responsable-financier';
import { useAbility } from '@/hooks/use-ability';
import { cn } from '@/lib/utils';

type UiActionKey = ActionGroupee | 'ORIENTER';

interface ActionMeta {
    besoin?: 'agent' | 'motif' | 'orientation';
    /** Vrai pour une action IRRÉVERSIBLE et négative : seule celle-là garde un bouton rouge. */
    estDestructive?: boolean;
    hint: string;
    icon: React.ElementType;
    key: UiActionKey;
    label: string;
    verbe: string;
}

// Ordre = déroulé du workflow. 2026-07-27 : « Viser (DGA) » supprimé — décider de
// l'orientation VAUT visa (posé implicitement par le backend depuis « En attente visa DGA »).
//
// Chaque action portait une `color` de la v2 — success, primary, warning, danger — qui ne
// servait qu'à peindre le bouton « Confirmer » de la fenêtre. Quatre couleurs pour un seul
// bouton dont le rôle ne change pas : c'est le geste principal de la fenêtre. Seul le rejet
// reste rouge, parce qu'il est le seul à défaire.
const ACTIONS: ActionMeta[] = [
    {
        hint: 'Factures « À valider ».',
        icon: CheckCircle2,
        key: 'VALIDER',
        label: 'Valider les factures',
        verbe: 'Valider',
    },
    {
        besoin: 'agent',
        hint: 'Factures « Validé ».',
        icon: HandCoins,
        key: 'RECOUVREMENT',
        label: 'Lancer le recouvrement',
        verbe: 'Lancer le recouvrement',
    },
    {
        hint: 'Factures « Versé au caissier ».',
        icon: Wallet,
        key: 'CONFIRMER_RECEPTION',
        label: 'Confirmer la réception',
        verbe: 'Confirmer la réception',
    },
    {
        besoin: 'orientation',
        hint: 'Factures « En attente visa DGA » : vise + oriente (banque ou caisse).',
        icon: ArrowLeftRight,
        key: 'ORIENTER',
        label: 'Orientation des fonds',
        verbe: 'Orientation des fonds',
    },
    {
        besoin: 'motif',
        estDestructive: true,
        hint: 'Factures « En attente visa DGA ».',
        icon: XCircle,
        key: 'REJETER_DGA',
        label: 'Rejeter (DGA)',
        verbe: 'Rejeter',
    },
];

export interface BulkActionsBarProps {
    /** Filtres courants, transmis au backend quand selectAllMatching. */
    filtres: IActionsGroupeesFiltres;
    /** Vider la sélection. */
    onClear: () => void;
    /** Rafraîchissement post-action (invalidation déjà faite par la mutation). */
    onDone?: () => void;
    /** true = toutes les factures du filtre courant (toutes pages). */
    selectAllMatching: boolean;
    /** IDs cochés explicitement (page courante). */
    selectedIds: string[];
    /** Nombre total de factures du filtre (pour l'affichage quand selectAllMatching). */
    totalElements: number;
}

export default function BulkActionsBar({
    filtres,
    onClear,
    onDone,
    selectAllMatching,
    selectedIds,
    totalElements,
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
        () =>
            ACTIONS.filter((a) =>
                a.key === 'ORIENTER' || a.key === 'REJETER_DGA' ? peutOrienter : true,
            ),
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
            ? { action: key, filtres, selectAll: true }
            : { action: key, ids: selectedIds, selectAll: false };
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

    const Icone = action?.icon;

    return (
        <>
            {/* Barre flottante */}
            <Card className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 shadow-xl">
                <Card.Content className="flex-row items-center gap-3 px-4 py-2.5">
                    <Button
                        aria-label="Vider la sélection"
                        onPress={onClear}
                        size="sm"
                        variant="ghost"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </Button>
                    <span className="text-sm font-medium text-foreground">
                        {selectAllMatching ? (
                            <>
                                Toutes les <b>{totalElements}</b> factures du filtre
                            </>
                        ) : (
                            <>
                                <b>{selectedIds.length}</b> facture{selectedIds.length > 1 ? 's' : ''}{' '}
                                sélectionnée{selectedIds.length > 1 ? 's' : ''}
                            </>
                        )}
                    </span>
                    {/*
                     * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` doit etre enfant
                     * direct de `Dropdown`, faute de quoi on obtient un bouton dans un bouton et
                     * une erreur d'hydratation a chaque rendu.
                     */}
                    <Dropdown>
                        <Button size="sm" variant="primary">
                            Actions groupées
                            <ChevronDown aria-hidden="true" className="size-4" />
                        </Button>
                        <Dropdown.Popover placement="top end">
                            <Dropdown.Menu
                                aria-label="Actions groupées"
                                onAction={(k) => {
                                    const meta = actionsDisponibles.find((a) => a.key === k);
                                    if (meta) ouvrir(meta);
                                }}
                            >
                                {actionsDisponibles.map((a) => (
                                    <Dropdown.Item id={a.key} key={a.key} textValue={a.label}>
                                        <a.icon aria-hidden="true" className="size-4 shrink-0" />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="text-sm">{a.label}</span>
                                            <span className="text-xs text-muted">{a.hint}</span>
                                        </span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </Card.Content>
            </Card>

            {/* Confirmation */}
            <Modal isOpen={!!action} onOpenChange={(o) => !o && setAction(null)}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading className="flex items-center gap-2">
                                    {Icone && <Icone aria-hidden="true" className="size-5" />}
                                    {action?.verbe} — {cible} facture{cible > 1 ? 's' : ''}
                                </Modal.Heading>
                                <Modal.CloseTrigger />
                            </Modal.Header>

                            <Modal.Body className="flex flex-col gap-4">
                                <p className="text-sm text-muted">
                                    {selectAllMatching ? (
                                        <>
                                            L&apos;action <b>{action?.verbe}</b> va être appliquée à{' '}
                                            <b>toutes les {totalElements} factures</b> correspondant au filtre
                                            courant (toutes pages).
                                        </>
                                    ) : (
                                        <>
                                            L&apos;action <b>{action?.verbe}</b> va être appliquée aux{' '}
                                            <b>{selectedIds.length} factures</b> sélectionnées.
                                        </>
                                    )}
                                </p>

                                {/* liste d'agents en echec : le select restait vide, comme si aucun agent n'existait */}
                                {action?.besoin === 'agent' && agentsEnErreur && (
                                    <EtatErreur
                                        enCours={agentsEnCours}
                                        onReessayer={() => relancerAgents()}
                                        quoi="les agents de recouvrement"
                                    />
                                )}

                                {action?.besoin === 'agent' && !agentsEnErreur && (
                                    <ComboBox
                                        isRequired
                                        onSelectionChange={(k) => setAgentId(k == null ? '' : String(k))}
                                        selectedKey={agentId || null}
                                    >
                                        <Label>Agent de recouvrement</Label>
                                        <ComboBox.InputGroup>
                                            <Input placeholder="Rechercher un agent…" />
                                            <ComboBox.Trigger />
                                        </ComboBox.InputGroup>
                                        <ComboBox.Popover>
                                            <ListBox items={agents ?? []}>
                                                {(ag: { id: string; nom: string; role?: string }) => (
                                                    <ListBox.Item id={ag.id} textValue={ag.nom}>
                                                        {ag.nom}
                                                        {ag.role ? (
                                                            <span className="text-muted"> · {ag.role}</span>
                                                        ) : null}
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                )}
                                            </ListBox>
                                        </ComboBox.Popover>
                                    </ComboBox>
                                )}

                                {action?.besoin === 'motif' && (
                                    <div className="flex flex-col gap-1.5">
                                        <Label>Motif du rejet</Label>
                                        {/*
                                         * `TextArea` n'est PAS compose : il ne prend pas de `label`, et son
                                         * `onChange` recoit un EVENEMENT DOM, la ou `TextField` passe la
                                         * valeur. Un `onValueChange` v2 laisse ici serait silencieusement
                                         * ignore et le champ ne remonterait rien.
                                         */}
                                        <TextArea
                                            onChange={(e) => setMotif(e.target.value)}
                                            placeholder="Expliquez le motif (obligatoire)"
                                            rows={3}
                                            value={motif}
                                        />
                                    </div>
                                )}

                                {action?.besoin === 'orientation' && (
                                    <div className="flex flex-col gap-3">
                                        {/*
                                         * C'etaient deux `<button type="button">` peints a la main, sans
                                         * role de choix : ni navigation au clavier entre les deux options,
                                         * ni annonce « 1 sur 2 » aux lecteurs d'ecran. C'est un choix
                                         * exclusif : c'est un groupe de boutons radio.
                                         */}
                                        <RadioGroup
                                            onChange={(v) => setOrientation(v as 'BANQUE' | 'CAISSE')}
                                            value={orientation}
                                        >
                                            <Label>Décision d&apos;orientation des fonds</Label>
                                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {[
                                                    {
                                                        detail: 'Débloque le dépôt du Comptable',
                                                        icone: Landmark,
                                                        titre: 'Dépôt en banque',
                                                        valeur: 'BANQUE' as const,
                                                    },
                                                    {
                                                        detail: 'Fonds de roulement · motif requis',
                                                        icone: PiggyBank,
                                                        titre: 'Conserver en caisse',
                                                        valeur: 'CAISSE' as const,
                                                    },
                                                ].map((o) => (
                                                    <div
                                                        className={cn(
                                                            'rounded-xl border p-3 transition-colors',
                                                            orientation === o.valeur
                                                                ? 'border-accent bg-accent-soft/30'
                                                                : 'border-separator',
                                                        )}
                                                        key={o.valeur}
                                                    >
                                                        <Radio className="w-full items-start" value={o.valeur}>
                                                            <Radio.Content className="flex w-full items-start gap-3">
                                                                <Radio.Control className="mt-1">
                                                                    <Radio.Indicator />
                                                                </Radio.Control>
                                                                <span className="flex min-w-0 flex-1 flex-col items-start">
                                                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                                                        <o.icone aria-hidden="true" className="size-4" />
                                                                        {o.titre}
                                                                    </span>
                                                                    <span className="text-xs text-muted">
                                                                        {o.detail}
                                                                    </span>
                                                                </span>
                                                            </Radio.Content>
                                                        </Radio>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                        <p className="text-xs text-muted">
                                            Le visa DGA est posé automatiquement (auteur, date, N° de visa) au
                                            moment de la décision.
                                        </p>
                                        {orientation === 'CAISSE' && (
                                            <div className="flex flex-col gap-1.5">
                                                <Label>Motif de conservation en caisse</Label>
                                                <TextArea
                                                    onChange={(e) => setMotif(e.target.value)}
                                                    placeholder="Expliquez pourquoi les fonds sont conservés (min. 30 caractères)"
                                                    rows={3}
                                                    value={motif}
                                                />
                                                <span
                                                    className={cn(
                                                        'text-xs',
                                                        motif.trim().length > 0 && motif.trim().length < 30
                                                            ? 'text-warning-soft-foreground'
                                                            : 'text-muted',
                                                    )}
                                                >
                                                    {motif.trim().length}/30 caractères minimum
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                                    <AlertTriangle
                                        aria-hidden="true"
                                        className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                                    />
                                    Seules les factures dont le statut permet cette action seront modifiées.
                                    Les autres sont ignorées et un récapitulatif s&apos;affiche.
                                </div>
                            </Modal.Body>

                            <Modal.Footer>
                                <Button
                                    isDisabled={mutation.isPending}
                                    onPress={() => setAction(null)}
                                    variant="ghost"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    isDisabled={!peutConfirmer}
                                    isPending={mutation.isPending}
                                    onPress={confirmer}
                                    variant={action?.estDestructive ? 'danger' : 'primary'}
                                >
                                    Confirmer
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}
