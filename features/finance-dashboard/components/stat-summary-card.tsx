import { Card } from '@heroui-v3/react';

interface StatSummaryCardProps {
    label: string;
    value: string;
    /** Couleur de la serie : sert UNIQUEMENT a teinter le fond de la carte. */
    color: string;
    /** Version sombre de la meme teinte, pour le texte. */
    textColor: string;
}

/*
 * Le libelle etait ecrit dans `color` et la valeur dans une version a peine plus
 * sombre, sur un fond fait de `color` a 12,5 %. Mesure au canvas : le libelle allait
 * de 1,95:1 (investissements) a 3,63:1 (encours), et la valeur de 2,90:1 a 4,89:1 —
 * trois des cinq valeurs sous le seuil de 4,5:1.
 *
 * La teinte du FOND continue d'identifier la serie, ce qui est son role : on la lit
 * d'un coup d'œil et on la retrouve sur la courbe. Le TEXTE, lui, n'a pas a repeter
 * cette information, il a a se lire. Il passe donc a la nuance sombre de la meme
 * teinte, entre 6,45:1 et 7,71:1 selon la serie. La hierarchie entre le libelle et
 * la valeur passe par la graisse et la taille, qui la portaient deja.
 */
export default function StatSummaryCard({ label, value, color, textColor }: StatSummaryCardProps) {
    return (
        <Card
            className="gap-0 rounded-lg p-4 text-center"
            style={{ backgroundColor: `${color}20` }}
            variant="transparent"
        >
            <p className="text-sm font-medium" style={{ color: textColor }}>
                {label}
            </p>
            <p className="truncate text-sm font-bold sm:text-base md:text-xl" style={{ color: textColor }}>
                {value}
            </p>
        </Card>
    );
}
