'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { EtatPerformance, type LignePerformance } from '@/features/performance/refonte/etat-performance';
import { cn } from '@/lib/utils';

/** Le banc de l'état de performance : quatre jeux d'essai, deux thèmes. */

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
    'SANOGO Karim', 'FOFANA Aboubacar',
];

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, decimales: boolean): LignePerformance[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    return NOMS.map((nom, i) => {
        const etats = JOURS.map((j, k) => {
            const r = suivant();
            return {
                date: `2026-09-${String(7 + k).padStart(2, '0')}`,
                jour: j,
                statut: r < 0.12 ? 'MANQUE' : r < 0.22 ? 'EN_COURS' : 'VALIDE',
            };
        });
        const valides = etats.filter((x) => x.statut === 'VALIDE').length;
        const perf = Math.round((valides / 7) * 100);
        const base = 8000 + Math.round(suivant() * 45000);
        return {
            id: `p${i}`,
            nomComplet: nom,
            etats,
            performance: perf,
            // Des decimales, parce que les commissions en pourcentage en produisent :
            // c'est la ou un formatage absent se voit.
            commission: decimales ? Number((base * 0.6).toFixed(2)) : Math.round(base * 0.6),
            prime: perf > 70 ? Math.round(base * 0.1) : 0,
        };
    });
}

const JEUX = {
    ordinaire: { libelle: 'Semaine ordinaire', lignes: fabriquer(11, false) },
    decimales: { libelle: 'Montants à décimales', lignes: fabriquer(23, true) },
    vide: { libelle: 'Aucun livreur', lignes: [] as LignePerformance[] },
};

export default function ApercuPerformance() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = React.useState(false);
    const [semaine, setSemaine] = React.useState('s1');

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Performance</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <span className="mx-1 h-4 w-px bg-separator" />
                    {(['normal', 'chargement', 'echec'] as const).map((e) => (
                        <Button key={e} onPress={() => setEtat(e)} size="sm" variant={etat === e ? 'secondary' : 'ghost'}>
                            {e}
                        </Button>
                    ))}
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main className="mx-auto max-w-[1400px] p-4">
                    <EtatPerformance
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        libelleSemaine="Semaine du 7 – 13 sept."
                        lignes={JEUX[jeu].lignes}
                        onSemaine={setSemaine}
                        semaineActive={semaine}
                        semaines={[
                            { cle: 's1', libelle: 'Semaine du 7 – 13 sept.' },
                            { cle: 's2', libelle: 'Semaine du 31 – 6 sept.' },
                            { cle: 's3', libelle: 'Semaine du 24 – 30 août' },
                        ]}
                    />
                </main>
            </div>
        </div>
    );
}
