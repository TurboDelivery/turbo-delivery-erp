'use client';

import { Button, Chip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

import { LienBouton } from '@/components/commons/LienBouton';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import { formatPeriodeFacturee } from '@/lib/finance/periode-facturee';
import { formatMontant } from '@/utils/format.utils';

// Statuts locaux alignés sur CDC v5
export type StatutFacture =
    | 'DRAFT'
    | 'À valider'
    | 'Validé'
    | 'Recouvrement'
    | 'En cours'
    | 'Déposé partenaire'
    | 'Preuve ajoutée'
    | `Acompte ${number}`
    | 'Soldé'
    | 'Versé au caissier'
    | 'En attente visa DGA'
    | 'Visé DGA'
    // SPEC-RECOUV-002 — orientation des fonds après visa.
    | 'Orienté banque'
    | 'Conservé en caisse'
    | 'Rejeté DGA'
    | 'Clôturé';

export interface IFactureRF {
    id: string;
    numero: string;
    partenaire: string;
    montant: number;
    montantRecouvre: number | null;
    pourcentageRecouvre: number | null;
    cycle: string;
    emission: string;
    // Bornes de la période facturée (exposées par le VM backend) — formatées en
    // « Période facturée » selon le cycle. Format LocalDate sérialisé : "2026-06-01".
    // Optionnelles : absentes des mock-data / réponses legacy (le formateur gère).
    periodeDebut?: string;
    periodeFin?: string;
    depotPartenaire: { agent: string; date: string } | null;
    depotBanque: string | null;
    agent: string;
    statut: StatutFacture;
}

/**
 * Re-export du formateur UNIQUE.
 *
 * <p>Ce dossier portait NEUF implementations locales de `formatMontant`, dont HUIT
 * rendaient « F CFA » et UNE « FCFA » : un comptable validait une facture et lisait
 * un suffixe dans la fenetre, un autre dans le tableau derriere. On re-exporte
 * plutot que de supprimer, pour ne pas toucher le fichier qui importe d'ici.</p>
 */
export { formatMontant };

/** L'attente, dite d'une seule façon quel que soit le maillon de la chaîne. */
function EnAttente({ children }: { children: React.ReactNode }) {
    return (
        <span className="flex items-center gap-1 text-xs text-muted">
            <Clock aria-hidden="true" className="size-3 shrink-0" /> {children}
        </span>
    );
}

export function createResponsableFinancierColumns(
    onValider: (facture: IFactureRF) => void,
    onLancerRecouvrement: (facture: IFactureRF) => void,
    onDepotBanque: (facture: IFactureRF) => void,
    // 2026-05 (fix post-test mardi) — callback optionnel pour le bouton
    // "Confirmer réception fonds" (D3 du workflow facture). Affiché quand la
    // facture est en statut "Versé au caissier". Si la callback est non passée
    // (ex. test ou pages legacy), le bouton n'est pas rendu.
    onConfirmerReception?: (facture: IFactureRF) => void,
): ColumnDef<IFactureRF>[] {
    return [
        {
            accessorKey: 'numero',
            cell: ({ row }) => (
                /*
                 * Le numero portait `cursor-pointer hover:underline` SANS lien : l'ecran
                 * promettait un clic qui ne menait nulle part. Il mene desormais la ou
                 * mene « Voir detail », a droite de la meme ligne.
                 */
                <Link
                    className="text-sm font-medium text-foreground hover:underline"
                    href={`/finance/comptabilite/responsable-financier/${row.original.id}`}
                >
                    {row.original.numero}
                </Link>
            ),
            header: 'N° facture',
        },
        {
            accessorKey: 'partenaire',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.partenaire}</span>,
            header: 'Partenaire',
        },
        {
            accessorKey: 'montant',
            /*
             * Le montant etait ecrit en `text-red-500`. Un montant facture n'est ni une
             * erreur ni une perte : le rouge y disait quelque chose de faux.
             */
            cell: ({ row }) => (
                <span className="text-sm font-bold tabular-nums whitespace-nowrap text-foreground">
                    {formatMontant(row.original.montant)}
                </span>
            ),
            header: 'Montant',
        },
        {
            accessorKey: 'montantRecouvre',
            cell: ({ row }) => {
                const { montantRecouvre, pourcentageRecouvre } = row.original;
                if (!montantRecouvre) return <span className="text-muted">—</span>;
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-sm tabular-nums">{formatMontant(montantRecouvre)}</span>
                        <Chip color="success" size="sm" variant="soft">
                            <Chip.Label>{pourcentageRecouvre}%</Chip.Label>
                        </Chip>
                    </div>
                );
            },
            header: 'Recouvré',
        },
        {
            accessorKey: 'cycle',
            cell: ({ row }) => <span className="text-sm">{row.original.cycle}</span>,
            header: 'Cycle',
        },
        {
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap">
                    {formatPeriodeFacturee(
                        row.original.cycle,
                        row.original.periodeDebut,
                        row.original.periodeFin,
                    )}
                </span>
            ),
            header: 'Période facturée',
            id: 'periodeFacturee',
        },
        {
            accessorKey: 'emission',
            cell: ({ row }) => <span className="text-sm">{row.original.emission}</span>,
            header: 'Émission',
        },
        {
            accessorKey: 'depotPartenaire',
            cell: ({ row }) => {
                const d = row.original.depotPartenaire;
                if (!d) return <span className="text-muted">—</span>;
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-sm">{d.date}</span>
                        <span className="text-xs text-muted">{d.agent}</span>
                        <Chip color="success" size="sm" variant="soft">
                            <CheckCircle2 aria-hidden="true" className="size-3" />
                            <Chip.Label>Preuve</Chip.Label>
                        </Chip>
                    </div>
                );
            },
            header: 'Dépôt partenaire',
        },
        {
            accessorKey: 'depotBanque',
            cell: ({ row }) => {
                const d = row.original.depotBanque;
                return d ? <span className="text-sm">{d}</span> : <span className="text-muted">—</span>;
            },
            header: 'Dépôt banque',
        },
        {
            accessorKey: 'agent',
            cell: ({ row }) => <span className="text-sm">{row.original.agent}</span>,
            header: 'Agent',
        },
        {
            accessorKey: 'statut',
            cell: ({ row }) => <ChipStatutFacture statut={row.original.statut} />,
            header: 'Statut',
        },
        {
            /*
             * Les gestes d'avancement portaient trois verts differents — `bg-green-600`,
             * `bg-foreground`, `bg-emerald-600` — pour trois etapes de la MEME chaine.
             * Une seule ligne appelle un geste a la fois : un seul bouton plein.
             */
            cell: ({ row }) => {
                const { statut } = row.original;
                const voirDetail = (
                    <LienBouton
                        href={`/finance/comptabilite/responsable-financier/${row.original.id}`}
                        taille="sm"
                        variante="ghost"
                    >
                        Voir détail
                    </LienBouton>
                );

                if (statut === 'DRAFT' || statut === 'À valider') {
                    return (
                        <div className="flex items-center gap-2">
                            <Button onPress={() => onValider(row.original)} size="sm" variant="primary">
                                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                                Valider la facture
                            </Button>
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'Validé') {
                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                onPress={() => onLancerRecouvrement(row.original)}
                                size="sm"
                                variant="primary"
                            >
                                Lancer recouvrement
                            </Button>
                            {voirDetail}
                        </div>
                    );
                }
                if (
                    statut === 'Recouvrement' ||
                    statut === 'En cours' ||
                    statut === 'Déposé partenaire' ||
                    statut === 'Preuve ajoutée' ||
                    statut.startsWith('Acompte') ||
                    statut === 'Soldé'
                ) {
                    return (
                        <div className="flex items-center gap-2">
                            <EnAttente>En cours de recouvrement</EnAttente>
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'Versé au caissier') {
                    return (
                        <div className="flex items-center gap-2">
                            {/* 2026-05 (fix post-test mardi) — Bouton D3 visible pour
                                COMPTABLE + DGA + DG. La permission CASL "manage Finance"
                                couvre les 3 rôles ; le backend re-valide qu'on est dans un
                                statut compatible et renvoie 400 sinon. */}
                            {onConfirmerReception ? (
                                <Button
                                    onPress={() => onConfirmerReception(row.original)}
                                    size="sm"
                                    variant="primary"
                                >
                                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                                    Confirmer réception fonds
                                </Button>
                            ) : (
                                <EnAttente>Versé au caissier</EnAttente>
                            )}
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'En attente visa DGA') {
                    return (
                        <div className="flex items-center gap-2">
                            <EnAttente>En attente visa DGA</EnAttente>
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'Orienté banque') {
                    return (
                        <div className="flex items-center gap-2">
                            <Button onPress={() => onDepotBanque(row.original)} size="sm" variant="primary">
                                Dépôt en banque
                            </Button>
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'Rejeté DGA') {
                    return (
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-medium text-danger">
                                <AlertCircle aria-hidden="true" className="size-3 shrink-0" /> Rejeté DGA
                            </span>
                            {voirDetail}
                        </div>
                    );
                }
                if (statut === 'Clôturé') {
                    return (
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-medium text-success">
                                <CheckCircle2 aria-hidden="true" className="size-3 shrink-0" /> Clôturé
                            </span>
                            {voirDetail}
                        </div>
                    );
                }
                return voirDetail;
            },
            header: 'Actions',
            id: 'actions',
        },
    ];
}
