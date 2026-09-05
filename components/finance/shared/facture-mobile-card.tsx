'use client';

import { Card } from '@heroui-v3/react';
import type { ReactNode } from 'react';

export interface MobileCardField {
    label: string;
    value: ReactNode;
}

/**
 * Carte facture mobile — affichage tactile adapté aux petits écrans, en
 * remplacement du tableau dense (cf. wrapper `hidden md:block` / `md:hidden`).
 * Utilisée par les pages Comptabilité (caissier, responsable financier, agent
 * recouvreur) qui partagent la même forme de ligne (numéro, partenaire,
 * montant, statut, actions).
 *
 * <h3>Ce qui change</h3>
 * <p>Le statut n'est plus un couple `(texte, classe CSS)` que la carte assemble en
 * pastille : c'est un nœud que l'appelant fournit — en pratique le `ChipStatutFacture`
 * commun. La carte ne peint plus de statut, elle le place.</p>
 *
 * <p>Le numéro et le montant étaient écrits en `text-red-500`. Un numéro de facture
 * n'est pas une alerte et un montant facturé n'est pas une perte : ils passent aux
 * jetons du thème, et le montant aux chiffres tabulaires.</p>
 */
export function FactureMobileCard({
    actions,
    fields,
    montant,
    numero,
    onClick,
    partenaire,
    statut,
}: {
    actions?: ReactNode;
    fields?: MobileCardField[];
    montant: string; // déjà formaté
    numero: string;
    onClick?: () => void;
    partenaire: string;
    statut: ReactNode;
}) {
    return (
        <Card
            className={onClick ? 'cursor-pointer active:bg-surface-secondary' : undefined}
            onClick={onClick}
        >
            <Card.Content className="gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{partenaire}</p>
                        <p className="text-xs font-medium text-muted">{numero}</p>
                    </div>
                    <div className="shrink-0">{statut}</div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Montant</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{montant}</span>
                </div>

                {fields
                    ?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '')
                    .map((f, i) => (
                        <div className="flex items-center justify-between gap-3" key={i}>
                            <span className="shrink-0 text-xs text-muted">{f.label}</span>
                            <span className="truncate text-right text-sm text-foreground">{f.value}</span>
                        </div>
                    ))}

                {actions && (
                    <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function MobileCardList({ children }: { children: ReactNode }) {
    return <div className="space-y-3 md:hidden">{children}</div>;
}
