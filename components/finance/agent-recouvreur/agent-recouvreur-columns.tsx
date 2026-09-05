'use client';

import { Button, Checkbox } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Banknote, CheckCircle2, ClipboardList, Clock, Landmark } from 'lucide-react';

import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

/**
 * Re-export du formateur UNIQUE.
 *
 * <p>Ce module portait sa propre implementation, et ce dossier en comptait CINQ au
 * total qui ne s'accordaient meme pas entre elles : trois rendaient « F CFA », deux
 * « FCFA », sur les memes ecrans. On re-exporte plutot que de supprimer, pour ne pas
 * avoir a toucher les deux fichiers qui importent d'ici.</p>
 */
export { formatMontant };

/** L'attente, dite d'une seule façon quel que soit le maillon de la chaîne. */
function EnAttente({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <Clock aria-hidden="true" className="size-3.5 shrink-0" /> {children}
        </span>
    );
}

/** Le raccourci « verser au caissier », toujours second quand il accompagne un encaissement. */
function VerserAuCaissier({
    estPrincipal,
    onPress,
}: {
    estPrincipal: boolean;
    onPress: () => void;
}) {
    return (
        <Button
            className="whitespace-nowrap"
            onPress={onPress}
            size="sm"
            variant={estPrincipal ? 'primary' : 'outline'}
        >
            <Landmark aria-hidden="true" className="size-3.5" />
            Verser au caissier
        </Button>
    );
}

/**
 * Rendu des actions agent recouvreur selon le statut + le montant recouvré.
 * Extrait pour être PARTAGÉ entre la colonne du tableau (desktop) et les cartes
 * tactiles (mobile) : les deux affichaient auparavant leur propre copie.
 *
 * <h3>Six couleurs pour une seule intention</h3>
 * <p>« Dépôt chez le partenaire » était `bg-red-600` — du rouge pour une étape
 * ordinaire de la chaîne —, « Encaisser » `bg-green-600`, « Ajouter acompte »
 * `bg-blue-600`, « Verser au caissier » `bg-slate-700`. Quatre teintes pour quatre
 * gestes qui font tous la même chose : avancer la facture d'un cran.</p>
 *
 * <p>Ce qui compte réellement quand deux boutons cohabitent — « Encaisser » et
 * « Verser au caissier » — c'est lequel est l'étape ATTENDUE et lequel est un
 * raccourci. Un bouton plein pour l'étape attendue, un bouton bordé pour le
 * raccourci. Un seul geste principal par ligne.</p>
 */
export function renderAgentActions(
    facture: IFactureAgent,
    onDepotPartenaire: (f: IFactureAgent) => void,
    onEncaisser: (f: IFactureAgent) => void,
    onVerserCaissier: (f: IFactureAgent) => void,
) {
    const { statut } = facture;

    if (statut === 'Recouvrement') {
        return (
            <Button
                className="whitespace-nowrap"
                onPress={() => onDepotPartenaire(facture)}
                size="sm"
                variant="primary"
            >
                <ClipboardList aria-hidden="true" className="size-3.5" />
                Dépôt chez le partenaire
            </Button>
        );
    }

    if (statut === 'Déposé partenaire') {
        const { montant, montantRecouvre } = facture;
        const hasRecouvrement = montantRecouvre !== null && montantRecouvre > 0;
        const isFullyCovered = hasRecouvrement && montant > 0 && (montantRecouvre as number) >= montant;
        if (isFullyCovered) {
            return <VerserAuCaissier estPrincipal onPress={() => onVerserCaissier(facture)} />;
        }
        return (
            <div className="flex items-center gap-2">
                <Button
                    className="whitespace-nowrap"
                    onPress={() => onEncaisser(facture)}
                    size="sm"
                    variant="primary"
                >
                    <Banknote aria-hidden="true" className="size-3.5" />
                    Encaisser
                </Button>
                {hasRecouvrement && (
                    <VerserAuCaissier estPrincipal={false} onPress={() => onVerserCaissier(facture)} />
                )}
            </div>
        );
    }

    if (statut.startsWith('Acompte')) {
        const { montant, montantRecouvre } = facture;
        const isFullyCovered = montantRecouvre !== null && montant > 0 && montantRecouvre >= montant;
        if (isFullyCovered) {
            return <VerserAuCaissier estPrincipal onPress={() => onVerserCaissier(facture)} />;
        }
        return (
            <div className="flex items-center gap-2">
                <Button
                    className="whitespace-nowrap"
                    onPress={() => onEncaisser(facture)}
                    size="sm"
                    variant="primary"
                >
                    <Banknote aria-hidden="true" className="size-3.5" />
                    Ajouter acompte
                </Button>
                <VerserAuCaissier estPrincipal={false} onPress={() => onVerserCaissier(facture)} />
            </div>
        );
    }

    if (statut === 'Soldé') {
        return <VerserAuCaissier estPrincipal onPress={() => onVerserCaissier(facture)} />;
    }

    const { montant, montantRecouvre } = facture;
    const peutEncaisserEncore = montantRecouvre === null || (montant > 0 && montantRecouvre < montant);

    /** Le complément d'encaissement reste possible pendant l'attente : jamais le geste attendu. */
    const nouvelAcompte = peutEncaisserEncore ? (
        <Button
            className="whitespace-nowrap"
            onPress={() => onEncaisser(facture)}
            size="sm"
            variant="outline"
        >
            <Banknote aria-hidden="true" className="size-3.5" /> Nouvel acompte
        </Button>
    ) : null;

    if (statut === 'Versé au caissier') {
        return (
            <div className="flex items-center gap-2">
                <EnAttente>En attente Caissier</EnAttente>
                {nouvelAcompte}
            </div>
        );
    }
    if (statut === 'En attente visa DGA') {
        return (
            <div className="flex items-center gap-2">
                <EnAttente>En attente visa DGA</EnAttente>
                {nouvelAcompte}
            </div>
        );
    }
    if (statut === 'Visé DGA') {
        return (
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0" /> Visé DGA
                </span>
                {nouvelAcompte}
            </div>
        );
    }
    if (statut === 'Rejeté DGA') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
                <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" /> Rejeté DGA
            </span>
        );
    }
    if (statut === 'Clôturé') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0" /> Clôturé
            </span>
        );
    }
    return <span className="text-xs text-muted">—</span>;
}

export function createAgentRecouvreurColumns(
    onDepotPartenaire: (facture: IFactureAgent) => void,
    onEncaisser: (facture: IFactureAgent) => void,
    onVerserCaissier: (facture: IFactureAgent) => void,
    // Ajoute une colonne de cases à cocher en tête (encaissement en masse). La
    // sélectivité ligne par ligne est portée par `enableRowSelection` côté table.
    withSelection = false,
): ColumnDef<IFactureAgent>[] {
    const selectionColumn: ColumnDef<IFactureAgent> = {
        cell: ({ row }) =>
            row.getCanSelect() ? (
                <Checkbox
                    aria-label="Sélectionner la facture"
                    isSelected={row.getIsSelected()}
                    onChange={(checked) => row.toggleSelected(checked)}
                    /*
                     * `slot={null}` : dans un `Table` v3, tout `Checkbox` est branche sur le
                     * contexte de selection de la table et exige `slot="selection"`, faute de
                     * quoi la page tombe en 500. Ici la selection est celle de TanStack, dont
                     * depend l'encaissement en masse.
                     */
                    slot={null}
                >
                    <Checkbox.Content>
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                    </Checkbox.Content>
                </Checkbox>
            ) : null,
        enableSorting: false,
        header: ({ table }) => (
            <Checkbox
                aria-label="Tout sélectionner"
                isIndeterminate={
                    table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
                }
                isSelected={table.getIsAllPageRowsSelected()}
                onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
                slot={null}
            >
                <Checkbox.Content>
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                </Checkbox.Content>
            </Checkbox>
        ),
        id: 'select',
    };

    const columns: ColumnDef<IFactureAgent>[] = [
        {
            accessorKey: 'numero',
            cell: ({ row }) => (
                <span className="text-xs font-medium whitespace-nowrap text-foreground">
                    {row.original.numero}
                </span>
            ),
            header: 'N° facture',
        },
        {
            accessorKey: 'partenaire',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-foreground">{row.original.partenaire}</span>
            ),
            header: 'Partenaire',
        },
        {
            accessorKey: 'montant',
            /* Le montant etait ecrit en `text-red-500` : un montant facture n'est pas une erreur. */
            cell: ({ row }) => (
                <span className="text-xs font-bold tabular-nums whitespace-nowrap text-foreground">
                    {formatMontant(row.original.montant)}
                </span>
            ),
            header: 'Montant',
        },
        {
            accessorKey: 'statut',
            cell: ({ row }) => <ChipStatutFacture statut={row.original.statut} />,
            header: 'Statut',
        },
        {
            cell: ({ row }) =>
                renderAgentActions(row.original, onDepotPartenaire, onEncaisser, onVerserCaissier),
            header: 'Actions',
            id: 'actions',
        },
    ];

    return withSelection ? [selectionColumn, ...columns] : columns;
}
