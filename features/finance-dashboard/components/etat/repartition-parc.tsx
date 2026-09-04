'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * Repartition du parc de livreurs, et disponibilite du jour.
 *
 * <p>Les trois sous-populations de Turboys etaient trois liens empiles dans un coin de
 * carte : « Indépendants (173) », « Journaliers (37) », « Superviseurs-livreurs (12) ».
 * Des proportions ecrites en chiffres demandent un calcul mental pour etre comparees.
 * Un anneau les donne d'un regard, et garde les nombres exacts en legende — on ne perd
 * donc rien, on ajoute la proportion.</p>
 */

export interface PartParc {
    libelle: string;
    valeur: number;
    couleur: string;
}

export function RepartitionParc({ parts, hauteur = 160 }: { parts: PartParc[]; hauteur?: number }) {
    const total = parts.reduce((s, p) => s + p.valeur, 0);

    // Anneau et legende s'empilent quand la carte est etroite : cote a cote dans 353 px,
    // la legende n'avait que 137 px et ses lignes se repliaient.
    return (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:flex-nowrap">
            <div className="shrink-0" style={{ width: hauteur, height: hauteur }}>
                <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                        <Pie
                            cx="50%"
                            cy="50%"
                            data={parts}
                            dataKey="valeur"
                            innerRadius="58%"
                            nameKey="libelle"
                            outerRadius="92%"
                            paddingAngle={1.5}
                            stroke="none"
                        >
                            {parts.map((p) => (
                                <Cell fill={p.couleur} key={p.libelle} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: 'var(--surface)',
                                border: '1px solid var(--separator)',
                                borderRadius: 10,
                                fontSize: 12,
                            }}
                            formatter={(v, nom) => {
                                const n = typeof v === 'number' ? v : 0;
                                return [`${n} (${total ? Math.round((n / total) * 100) : 0} %)`, String(nom)];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Les nombres exacts restent lisibles : l'anneau ajoute la proportion, il ne
                remplace pas la valeur. */}
            <ul className="w-full min-w-[150px] flex-1 space-y-1.5">
                {parts.map((p) => (
                    <li className="flex items-baseline gap-2 text-sm" key={p.libelle}>
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: p.couleur }}
                        />
                        <span className="min-w-0 flex-1 truncate text-muted">{p.libelle}</span>
                        <span className="font-semibold tabular-nums">{p.valeur}</span>
                        <span className="w-10 text-right text-xs tabular-nums text-muted">
                            {total ? Math.round((p.valeur / total) * 100) : 0} %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export interface BarreDisponibilite {
    libelle: string;
    valeur: number;
    couleur: string;
}

/**
 * Disponibilite du jour, en barres proportionnelles.
 *
 * <p>« 0 livreur disponible sur 222 » est un fait qu'on lit ; la barre vide a cote d'une
 * barre pleine le rend evident sans qu'on ait a le lire.</p>
 */
export function DisponibiliteJour({ barres, total }: { barres: BarreDisponibilite[]; total: number }) {
    return (
        <ul className="space-y-2.5">
            {barres.map((b) => {
                const part = total ? (b.valeur / total) * 100 : 0;
                return (
                    <li key={b.libelle}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                            <span className="text-muted">{b.libelle}</span>
                            <span className="font-semibold tabular-nums">{b.valeur}</span>
                        </div>
                        <div
                            aria-label={`${b.libelle} : ${b.valeur} sur ${total}`}
                            aria-valuemax={total}
                            aria-valuemin={0}
                            aria-valuenow={b.valeur}
                            className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
                            role="meter"
                        >
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${part}%`, backgroundColor: b.couleur }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
