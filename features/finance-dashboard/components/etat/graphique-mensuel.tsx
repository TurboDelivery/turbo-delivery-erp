'use client';

import { useMemo } from 'react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Revenus et depenses par mois, avec la marge en surimpression.
 *
 * <h3>Pourquoi des barres et une courbe, et non cinq courbes</h3>
 * <p>Le graphique precedent tracait CINQ courbes de meme epaisseur — revenus, depenses,
 * recouvrements, investissements, encours — dans cinq couleurs. Cinq series de meme
 * poids visuel ne se comparent pas : l'œil ne sait pas laquelle suivre, et les deux qui
 * comptent vraiment, ce que l'on gagne et ce que l'on depense, se noient dans les trois
 * autres.</p>
 *
 * <p>Ici deux barres cote a cote se comparent d'un coup d'œil — c'est ce que des barres
 * appariees font de mieux — et la marge, qui est leur difference, passe en courbe
 * par-dessus : une grandeur derivee se lit comme une tendance, pas comme un volume.</p>
 *
 * <h3>Les mois a venir</h3>
 * <p>Une annee en cours porte des mois futurs a zero. Les tracer ferait plonger la courbe
 * jusqu'a l'origine, ce qui se lit comme un effondrement alors que rien ne s'est encore
 * passe. La serie s'arrete donc au dernier mois qui porte un mouvement.</p>
 */

export interface MoisGraphique {
    mois: string;
    revenus: number;
    depenses: number;
}

interface GraphiqueMensuelProps {
    donnees: MoisGraphique[];
    /** Hauteur fixe. Omise, le graphique remplit son conteneur. */
    hauteur?: number;
}

/*
 * Couleurs portees par des variables CSS, definies sur le conteneur avec une valeur
 * par theme. Mesure a l'ecran : `#15803d` tient 4,95:1 sur une carte claire mais tombe
 * a 3,53:1 sur une carte sombre — sous le seuil pour le texte de la legende, qui reprend
 * la couleur de sa serie. Les nuances 400 remontent a 9,96 et 6,13 en sombre.
 */
const VERT = 'var(--graphique-revenus)';
const ROUGE = 'var(--graphique-depenses)';
const JETONS =
    '[--graphique-revenus:#15803d] [--graphique-depenses:#b91c1c] ' +
    'dark:[--graphique-revenus:#4ade80] dark:[--graphique-depenses:#f87171]';

/** Abrege l'axe : « 28,0 M » se lit, « 28 040 000 » remplit l'ecran. */
const abrege = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} k`;
    return String(v);
};

export function GraphiqueMensuel({ donnees, hauteur }: GraphiqueMensuelProps) {
    const serie = useMemo(() => {
        // Dernier mois qui porte un mouvement : au-dela, la donnee n'existe pas encore.
        let dernier = -1;
        donnees.forEach((d, i) => {
            if (d.revenus !== 0 || d.depenses !== 0) dernier = i;
        });
        return donnees.map((d, i) => ({
            ...d,
            // `null` interrompt la courbe ; `0` la ferait plonger a l'origine.
            marge: i <= dernier ? d.revenus - d.depenses : null,
        }));
    }, [donnees]);

    return (
        /*
         * Le graphique est pose en POSITION ABSOLUE dans un parent flexible.
         *
         * `ResponsiveContainer` mesure son parent au montage. Dans une colonne flex, un
         * enfant en `flex-1 h-full` n'a pas encore de hauteur resolue a cet instant : le
         * conteneur retient zero et ne se remesure jamais. Mesure a l'ecran, deux fois :
         * carte de 487 px puis de 572 px, graphique de 0 dans les deux cas.
         *
         * Un enfant absolu, lui, lit la taille DEJA calculee de son parent relatif sans
         * participer a son calcul. Le parent tire sa hauteur de la rangee de grille, et
         * le graphique la remplit.
         */
        <div className={cn(JETONS, 'relative', hauteur ? undefined : 'min-h-[260px] flex-1')} style={hauteur ? { height: hauteur } : undefined}>
            <div className="absolute inset-0">
            <ResponsiveContainer height="100%" width="100%">
                <ComposedChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="var(--separator)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        axisLine={false}
                        dataKey="mois"
                        stroke="var(--muted)"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        stroke="var(--muted)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={abrege}
                        tickLine={false}
                        width={46}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--separator)',
                            borderRadius: 10,
                            fontSize: 12,
                        }}
                        formatter={(valeur, nom) => [
                            // Meme signe moins qu'ailleurs : le trait d'union d'Intl est
                            // etroit, et sur une marge negative c'est le signe qui porte le sens.
                            typeof valeur === 'number' ? formatCFA(valeur).replace(/^[-\u2212]/, '\u2212') : '—',
                            String(nom),
                        ]}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    />
                    {/* Le libelle de legende reprenait la couleur de sa serie, donc 3,53:1
                        en sombre. La pastille suffit a porter l'identite ; le texte revient
                        a la couleur de lecture. */}
                    <Legend
                        formatter={(valeur) => (
                            <span style={{ color: 'var(--foreground)' }}>{String(valeur)}</span>
                        )}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                    />
                    <Bar dataKey="revenus" fill={VERT} name="Revenus" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="depenses" fill={ROUGE} name="Dépenses" radius={[3, 3, 0, 0]} />
                    <Line
                        connectNulls={false}
                        dataKey="marge"
                        dot={{ r: 2.5 }}
                        name="Marge"
                        stroke="var(--foreground)"
                        strokeWidth={2}
                        type="monotone"
                    />
                </ComposedChart>
            </ResponsiveContainer>
            </div>
        </div>
    );
}
