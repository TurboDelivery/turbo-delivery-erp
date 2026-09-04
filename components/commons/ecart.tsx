import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * L'ecart d'une grandeur avec la periode precedente.
 *
 * <p>La carte du chiffre d'affaires portait une fleche verte montante permanente : aucune
 * variation n'etait calculee, donc elle annonçait une hausse meme quand le chiffre
 * s'effondrait. Ce composant existe pour que ce cas ne puisse plus se produire — il
 * n'affiche rien tant qu'on ne lui donne pas les DEUX valeurs.</p>
 *
 * <h3>Le sens de la hausse depend de la grandeur</h3>
 * <p>Une hausse du chiffre d'affaires est une bonne nouvelle ; une hausse des depenses
 * ou de l'encours n'en est pas une. Peindre les deux en vert parce que la fleche monte
 * dirait quelque chose de faux. D'ou `sens`, qui dit ce qu'une hausse signifie POUR CETTE
 * GRANDEUR-LA. La fleche suit toujours le signe reel ; seule la couleur suit le sens.</p>
 *
 * <h3>Le cas du denominateur nul</h3>
 * <p>Passer de 0 a 8 462 730 n'est pas « +∞ % » ni « +100 % » : c'est un demarrage, et
 * aucun pourcentage n'a de sens. On l'ecrit alors en toutes lettres plutot que d'afficher
 * un nombre faux.</p>
 */
export type SensHausse = 'favorable' | 'defavorable' | 'neutre';

interface EcartProps {
    valeur: number;
    /** Valeur de la periode precedente. `undefined` = pas de comparaison disponible. */
    reference?: number;
    sens?: SensHausse;
    className?: string;
    /** Rappelle a quoi on compare, par ex. « vs mois precedent ». */
    libelleReference?: string;
}

export function Ecart({ valeur, reference, sens = 'neutre', className, libelleReference }: EcartProps) {
    // Sans les deux valeurs, on n'affiche RIEN. Une tendance non calculee ne s'invente pas.
    if (reference === undefined || !Number.isFinite(valeur) || !Number.isFinite(reference)) return null;

    const delta = valeur - reference;
    const stable = delta === 0;
    const hausse = delta > 0;

    // Le ton suit ce qu'une hausse veut dire pour CETTE grandeur, pas le signe brut.
    const favorable = sens === 'neutre' ? null : (hausse ? sens === 'favorable' : sens === 'defavorable');
    // Aucune nuance unique ne tient dans les deux themes : mesure au canvas sur les fonds
    // de carte reels, `green-800` donne 7,13:1 en clair mais 2,48:1 en sombre, et
    // `green-400` l'inverse (1,78 puis 9,96). D'ou une nuance par theme.
    // Retenu : clair 800 (7,13 et 8,36), sombre 400 (9,96 et 6,13).
    const ton = stable || favorable === null
        ? 'text-muted'
        : favorable
          ? 'text-green-800 dark:text-green-400'
          : 'text-red-800 dark:text-red-400';

    const Fleche = stable ? Minus : hausse ? ArrowUp : ArrowDown;

    // Un pourcentage exige un denominateur : sinon on dit ce qui s'est passe, en mots.
    const pourcentage = reference !== 0 ? Math.abs(delta / reference) * 100 : null;
    const texte = stable
        ? 'stable'
        : pourcentage === null
          ? hausse ? 'demarrage sur la periode' : 'plus aucun mouvement'
          : `${hausse ? '+' : '−'}${pourcentage.toLocaleString('fr-FR', { maximumFractionDigits: pourcentage < 10 ? 1 : 0 })} %`;

    return (
        <span className={cn('inline-flex items-center gap-1 text-xs tabular-nums', ton, className)}>
            <Fleche aria-hidden="true" className="size-3.5 shrink-0" />
            {texte}
            {libelleReference && <span className="text-muted">{libelleReference}</span>}
        </span>
    );
}
