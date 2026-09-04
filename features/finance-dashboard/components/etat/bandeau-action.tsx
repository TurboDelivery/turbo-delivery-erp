import { buttonVariants } from '@heroui-v3/react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Ce qui attend un geste, avant ce qui informe.
 *
 * <p>Sur l'ecran precedent, « Comptes en attente » — des inscriptions livreur qu'il faut
 * valider — avait exactement la meme forme que « Partenaire Actif », qui est une
 * information pure. Rien ne distinguait ce qui attend un geste de ce qui se constate.</p>
 *
 * <p>Ce composant ne fait que GENERALISER un motif deja eprouve dans le projet :
 * `features/trafic/components/trafic-pointages-banner.tsx`. Ses trois qualites sont
 * reprises telles quelles :</p>
 * <ul>
 *   <li>il ne s'affiche QUE s'il y a reellement quelque chose a faire ;</li>
 *   <li>il enonce la CONSEQUENCE de ne pas agir, pas seulement un compteur — « ces
 *       livreurs ne recoivent aucune course tant que la decision n'est pas prise » dit
 *       pourquoi ca presse, la ou « 3 en attente » ne dit rien ;</li>
 *   <li>il porte le geste, avec sa destination.</li>
 * </ul>
 *
 * <p>C'est la seule zone de l'ecran qui porte l'accent de marque. Ailleurs il n'appelle
 * rien, donc il n'a rien a dire.</p>
 */

export interface ElementAction {
    cle: string;
    /** Ce qui attend, au singulier : « compte livreur ». */
    quoi: string;
    /**
     * Le pluriel, ecrit en entier. Ajouter un « s » a la fin de la chaine donnait
     * « 3 compte livreurs » : la marque tombait sur le qualifiant, pas sur le nom.
     * Le francais ne se derive pas par concatenation.
     */
    quoiPluriel: string;
    nombre: number;
    /** Ce qui se passe tant que personne n'agit. */
    consequence: string;
    href: string;
    libelleAction: string;
}

interface BandeauActionProps {
    elements: ElementAction[];
}

export function BandeauAction({ elements }: BandeauActionProps) {
    const aFaire = elements.filter((e) => e.nombre > 0);
    // Un bandeau vide est pire qu'absent : il apprend a ne plus le regarder.
    if (aFaire.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {aFaire.map((e) => (
                <div
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3"
                    key={e.cle}
                >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                        <ShieldAlert aria-hidden="true" className="size-5 text-accent" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                            <span className="tabular-nums">{e.nombre}</span>{' '}
                            {e.nombre > 1 ? e.quoiPluriel : e.quoi} en attente
                        </p>
                        <p className="text-xs leading-snug text-muted">{e.consequence}</p>
                    </div>
                    {/*
                     * Un `Link` habille en bouton, et non un `Button` rendu en lien : le
                     * `render` du Button v3 transmet des props de `<button>`, que `next/link`
                     * refuse au typage. `buttonVariants` donne exactement le meme habillage.
                     */}
                    <Link className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')} href={e.href}>
                        {e.libelleAction}
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
            ))}
        </div>
    );
}
