'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import {
    SemaineCreneaux,
    type JourCreneau,
    type LigneTurboy,
    type StatutJour,
} from '@/features/creneaux/refonte/semaine-creneaux';
import { cn } from '@/lib/utils';

/**
 * Le banc de la semaine des créneaux.
 *
 * <p>Quatre jeux d'essai, parce que les défauts d'un écran ne se voient pas sur le cas
 * moyen : une semaine ordinaire, une semaine chargée en absences, une semaine vide, et
 * l'échec de lecture. Plus le thème sombre, où la moitié des écrans de l'ERP se cassait
 * jusqu'à cette semaine.</p>
 */

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
    'SANOGO Karim', 'FOFANA Aboubacar', 'TOURE Bakary', 'CISSE Yacouba', 'KEITA Sekou',
    'SYLLA Boubacar', 'CAMARA Ousmane', 'DEMBELE Modibo',
];

/** Une semaine reproductible : pas de hasard, sinon deux rendus diffèrent. */
function fabriquerSemaine(graine: number, tauxAbsence: number): LigneTurboy[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    return NOMS.map((nom, i) => {
        const jours: JourCreneau[] = JOURS.map((j, k) => {
            const d = new Date(2026, 8, 7 + k);
            const r = suivant();
            let statut: StatutJour = 'PRESENT';
            if (r < tauxAbsence) statut = 'ABSENT';
            else if (r < tauxAbsence + 0.08) statut = 'RETARD';
            else if (r < tauxAbsence + 0.14) statut = 'JUSTIFIE';
            else if (r > 0.94) statut = 'NON_INSCRIT';
            return { jour: j, date: d.toISOString().slice(0, 10), statut };
        });
        const presents = jours.filter((j) => j.statut === 'PRESENT' || j.statut === 'RETARD').length;
        return {
            id: `t${i}`,
            nomComplet: nom,
            jours,
            assiduite: Math.round((presents / 7) * 100),
        };
    });
}

const JEUX = {
    ordinaire: { libelle: 'Semaine ordinaire', turboys: fabriquerSemaine(7, 0.07) },
    chargee: { libelle: 'Beaucoup d’absences', turboys: fabriquerSemaine(19, 0.28) },
    vide: { libelle: 'Aucun turboy', turboys: [] as LigneTurboy[] },
};

export default function ApercuCreneaux() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = React.useState(false);
    const [mode, setMode] = React.useState<'previsionnel' | 'realite'>('previsionnel');
    const [recherche, setRecherche] = React.useState('');
    const [journal, setJournal] = React.useState<string[]>([]);

    const turboys = React.useMemo(() => {
        const base = JEUX[jeu].turboys;
        if (!recherche.trim()) return base;
        const q = recherche.trim().toLowerCase();
        return base.filter((t) => t.nomComplet.toLowerCase().includes(q));
    }, [jeu, recherche]);

    const parJour = React.useMemo(
        () =>
            JOURS.map((j, k) => {
                const d = new Date(2026, 8, 7 + k).toISOString().slice(0, 10);
                const total = JEUX[jeu].turboys.filter((t) =>
                    t.jours.some((x) => x.date === d && x.statut !== 'NON_INSCRIT'),
                ).length;
                const presents = JEUX[jeu].turboys.filter((t) =>
                    t.jours.some((x) => x.date === d && (x.statut === 'PRESENT' || x.statut === 'RETARD')),
                ).length;
                return { jour: j, date: d, presents, total };
            }),
        [jeu],
    );

    const noter = (m: string) => setJournal((p) => [m, ...p].slice(0, 4));

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Créneaux</span>
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

                <main className="mx-auto flex max-w-[1400px] flex-col gap-3 p-4">
                    <SemaineCreneaux
                        alertes={
                            jeu === 'chargee'
                                ? [
                                      {
                                          type: 'rupture_reseau',
                                          message: 'Rupture de réseau prévue : moins de 60 % de couverture',
                                          joursImpactes: ['Samedi', 'Dimanche'],
                                      },
                                  ]
                                : []
                        }
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        libelleSemaine="Semaine du 7 au 13 septembre 2026"
                        mode={mode}
                        onMode={setMode}
                        onOuvrirJour={(d) => noter(`Ouvrir le détail du ${d}`)}
                        onRecherche={setRecherche}
                        onReessayer={() => noter('Relecture de la semaine')}
                        onSemainePrecedente={() => noter('Semaine précédente')}
                        onSemaineSuivante={() => noter('Semaine suivante')}
                        onTraiterAbsence={(t, j) => noter(`Traiter l’absence de ${t.nomComplet} — ${j.jour}`)}
                        parJour={parJour}
                        recherche={recherche}
                        taux={
                            etat === 'echec'
                                ? null
                                : { tauxPresenceGlobal: 87, retention: 92, fideliteTurboys: 84, capaciteGlobale: 78 }
                        }
                        turboys={turboys}
                    />

                    {journal.length > 0 && (
                        <div className="rounded-lg border border-separator bg-surface-secondary/50 p-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                                Gestes déclenchés
                            </p>
                            {journal.map((m, i) => (
                                <p className="text-xs text-foreground" key={`${m}-${i}`}>
                                    {m}
                                </p>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
