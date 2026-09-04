import { Chip } from '@heroui-v3/react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

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
    /**
     * La phrase entiere, ecrite par l'appelant.
     *
     * <p>Une premiere version imposait le gabarit « N <chose> en attente ». Les quatre
     * alertes reelles n'entrent pas dedans : « 6 heures avant verrouillage en attente »
     * ne veut rien dire, et l'absence de livreur disponible n'est pas un compteur qui
     * attend — c'est un zero qui alarme. Un gabarit qui deforme trois cas sur quatre
     * n'est pas un gabarit, c'est une contrainte. L'appelant ecrit donc sa phrase.</p>
     */
    titre: string;
    /** Ce qui se passe tant que personne n'agit — porte par l'info-bulle du lien. */
    consequence: string;
    /** Version courte de la consequence, tenue sur la meme ligne. */
    incise?: string;
    href: string;
    libelleAction: string;
    /** Le bandeau n'apparait que si quelque chose le justifie. */
    actif: boolean;
}

interface BandeauActionProps {
    elements: ElementAction[];
}

export function BandeauAction({ elements }: BandeauActionProps) {
    const aFaire = elements.filter((e) => e.actif);
    // Un bandeau vide est pire qu'absent : il apprend a ne plus le regarder.
    if (aFaire.length === 0) return null;

    // Forme de PASTILLE, pas de bandeau pleine largeur : quatre bandeaux empiles
    // repoussaient les chiffres sous la ligne de flottaison. Une pastille dit la meme
    // chose — le fait, sa consequence en une incise, le lien — sur une ligne.
    //
    // `soft` est la seule variante neutre du `Chip` v3 (les autres sont primary,
    // secondary et tertiary) ; l'accent vient des classes, puisque c'est la seule zone
    // de l'ecran qui appelle un geste.
    return (
        <div className="flex flex-wrap gap-2">
            {aFaire.map((e) => (
                <Chip
                    className="max-w-full items-start gap-2 border-accent/30 bg-accent-soft text-foreground sm:items-center"
                    key={e.cle}
                    variant="soft"
                >
                    <ShieldAlert aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                    <span className="font-semibold tabular-nums text-foreground">{e.titre}</span>
                    {/* L'incise disparait sous `sm` : tronquee en « — la carte du tr... »
                        elle ne dit plus rien, et volait la place au libelle et au lien.
                        La consequence complete reste portee par l'info-bulle du lien. */}
                    {e.incise && <span className="hidden truncate text-muted sm:inline">— {e.incise}</span>}
                    <Link
                        className="shrink-0 rounded-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                        href={e.href}
                        title={e.consequence}
                    >
                        {e.libelleAction}
                    </Link>
                </Chip>
            ))}
        </div>
    );
}
