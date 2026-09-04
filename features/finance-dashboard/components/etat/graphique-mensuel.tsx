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

const VERT = '#15803d';
const ROUGE = '#b91c1c';

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
        <div className={hauteur ? undefined : 'h-full min-h-[260px]'} style={hauteur ? { height: hauteur } : undefined}>
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
                            typeof valeur === 'number' ? formatCFA(valeur) : '—',
                            String(nom),
                        ]}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
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
    );
}
