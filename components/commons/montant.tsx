import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { cn } from '@/lib/utils';

/**
 * Un montant, ecrit pour etre COMPARE a celui du dessus.
 *
 * <p>Les montants du tableau de bord etaient poses en graisses et en tailles variables,
 * chacun dans sa tuile, sans alignement commun. Deux nombres qu'on ne peut pas aligner
 * ne se comparent pas : l'œil doit relire chaque chiffre au lieu de voir d'un coup
 * lequel est le plus grand.</p>
 *
 * <p>D'ou `tabular-nums` — chaque chiffre occupe la meme largeur, donc les unites, les
 * milliers et les millions tombent les uns sous les autres — et l'alignement a droite.
 * C'est la convention deja etablie dans les tableaux de tickets
 * (`components/tickets/table/ticket-table-columns.tsx`), on la reprend telle quelle.</p>
 */
export type TailleMontant = 'sm' | 'md' | 'lg' | 'xl';

const TAILLES: Record<TailleMontant, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl 2xl:text-4xl',
};

interface MontantProps {
    valeur: number;
    taille?: TailleMontant;
    className?: string;
    /** Rend la ligne moins appuyee quand la valeur est nulle : rien ne s'est passe. */
    attenuerSiNul?: boolean;
}

export function Montant({ valeur, taille = 'md', className, attenuerSiNul = false }: MontantProps) {
    const nul = !Number.isFinite(valeur) || valeur === 0;
    return (
        <span
            className={cn(
                'block text-right font-semibold tabular-nums',
                TAILLES[taille],
                nul && attenuerSiNul && 'font-normal text-muted',
                className,
            )}
        >
            {formatCFA(valeur)}
        </span>
    );
}

/**
 * Un effectif : meme exigence d'alignement, sans unite monetaire.
 */
export function Effectif({ valeur, taille = 'lg', className }: Omit<MontantProps, 'attenuerSiNul'>) {
    return (
        <span className={cn('block text-right font-semibold tabular-nums', TAILLES[taille], className)}>
            {new Intl.NumberFormat('fr-FR').format(Number.isFinite(valeur) ? valeur : 0)}
        </span>
    );
}
