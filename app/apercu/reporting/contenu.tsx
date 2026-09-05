'use client';

import { Button, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import React from 'react';

import type {
    IJournalActivite,
    IJournalFiltre,
    IRapportPresence,
    ModuleActivite,
} from '@/features/reporting';
import { VueJournal } from '@/features/reporting/refonte/vue-journal';
import { VueRapportPresence } from '@/features/reporting/refonte/vue-rapport-presence';

/** Le banc du reporting : les deux panneaux, trois jeux d'essai, deux thèmes. */

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou',
];

const MODULES: ModuleActivite[] = ['COMPTE', 'CRENEAU', 'POINTAGE', 'GAIN', 'COMMUNICATION', 'SUIVI'];
const ACTIONS = ['CREATION', 'MODIFICATION', 'VALIDATION', 'REJET', 'PUBLICATION'];
const AUTEURS = ['AGENT', 'LIVREUR', 'SYSTEME'] as const;

/** Reproductible : deux rendus doivent montrer la même chose. */
function alea(graine: number) {
    let e = graine;
    return () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
}

function fabriquerJournal(graine: number, nb: number): IJournalActivite[] {
    const suivant = alea(graine);
    return Array.from({ length: nb }).map((_, i) => ({
        action: ACTIONS[i % ACTIONS.length],
        auteurNom: NOMS[i % NOMS.length],
        auteurType: AUTEURS[i % AUTEURS.length],
        cibleId: null,
        cibleType: null,
        id: `j${graine}-${i}`,
        libelle:
            suivant() < 0.4
                ? 'Le programme hebdomadaire a été publié et envoyé au livreur pour acceptation, avec relance automatique à 24 h.'
                : 'Pointage de montée enregistré.',
        livreurId: `l${i}`,
        metadata: null,
        module: MODULES[i % MODULES.length],
        occurredAt: `2026-08-${String(1 + (i % 28)).padStart(2, '0')}T0${6 + (i % 4)}:${String(10 + (i % 45)).padStart(2, '0')}:00`,
    }));
}

function signal(heure: string | null, horsZone: boolean, justifie: boolean, distance: number | null) {
    return heure
        ? { conforme: !horsZone, distanceMetres: distance, heure, horsZone, horsZoneJustifiee: justifie, statut: 'OK' }
        : null;
}

function fabriquerRapport(graine: number, nbJours: number): IRapportPresence {
    const suivant = alea(graine);
    const jours = Array.from({ length: nbJours }).map((_, i) => {
        const r = suivant();
        const statut = r < 0.12 ? 'ABSENT' : r < 0.3 ? 'LATE' : 'PRESENT';
        const hz = suivant() < 0.25;
        const justifie = hz && suivant() < 0.5;
        const jour = `2026-08-${String(1 + i).padStart(2, '0')}`;
        return {
            absenceJustifiee: statut === 'ABSENT' ? suivant() < 0.5 : null,
            absenceMotif: null,
            date: jour,
            fin: statut === 'ABSENT' ? null : signal(`${jour}T17:${String(10 + i).padStart(2, '0')}:00`, false, false, 40),
            intermediaire: statut === 'ABSENT' ? null : signal(`${jour}T11:30:00`, false, false, 30),
            intermediaire2: statut === 'ABSENT' ? null : signal(`${jour}T14:30:00`, hz, justifie, hz ? 2400 : 25),
            jour: null,
            montee: statut === 'ABSENT' ? null : signal(`${jour}T06:${String(5 + i).padStart(2, '0')}:00`, false, false, 18),
            penaliteFcfa: statut === 'ABSENT' ? 2000 : hz && !justifie ? 500 : null,
            statutJour: statut,
        };
    });
    const presents = jours.filter((j) => j.statutJour === 'PRESENT').length;
    const retards = jours.filter((j) => j.statutJour === 'LATE').length;
    const absents = jours.filter((j) => j.statutJour === 'ABSENT').length;
    return {
        cote: 78,
        debut: '2026-08-01',
        fin: '2026-08-28',
        jours,
        livreurId: 'l0',
        nomComplet: NOMS[0],
        synthese: {
            absents,
            joursActifs: jours.length,
            justifies: 1,
            presents,
            retards,
            tauxAssiduite: Math.round((presents / jours.length) * 100),
            totalPenalitesFcfa: jours.reduce((n, j) => n + (j.penaliteFcfa ?? 0), 0),
        },
    };
}

const JEUX = {
    ordinaire: { journal: fabriquerJournal(11, 12), libelle: 'Mois ordinaire', rapport: fabriquerRapport(23, 20) },
    charge: { journal: fabriquerJournal(37, 12), libelle: 'Beaucoup d’anomalies', rapport: fabriquerRapport(71, 24) },
    vide: {
        journal: [] as IJournalActivite[],
        libelle: 'Rien à montrer',
        rapport: { ...fabriquerRapport(5, 0), jours: [] },
    },
};

const LIVREURS = NOMS.map((n, i) => ({ id: `l${i}`, nom: n }));

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
    const [sombre, setSombre] = React.useState(false);
    React.useEffect(() => {
        const html = document.documentElement;
        const avant = html.className;
        html.className = sombre ? 'dark' : 'light';
        return () => {
            html.className = avant;
        };
    }, [sombre]);
    return [sombre, setSombre];
}

export default function ApercuReporting() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = useThemeSombre();
    const [onglet, setOnglet] = React.useState('journal');

    const [filtre, setFiltre] = React.useState<IJournalFiltre>({
        debut: null,
        fin: null,
        keysearch: '',
        module: [],
        page: 0,
    });
    const [livreurId, setLivreurId] = React.useState<string | null>('l0');
    const [debut, setDebut] = React.useState('');
    const [fin, setFin] = React.useState('');

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Reporting</span>
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

                <main className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Reporting &amp; historisation</h1>
                        <p className="text-sm text-muted">
                            Journal transverse horodaté et attribué (CDC RG-11) et rapport de présence par livreur
                            (RG-21).
                        </p>
                    </div>

                    <ToggleButtonGroup
                        onSelectionChange={(s) => {
                            const v = Array.from(s)[0];
                            if (v) setOnglet(String(v));
                        }}
                        selectedKeys={new Set([onglet])}
                        selectionMode="single"
                    >
                        <ToggleButton id="journal">Journal d’activité</ToggleButton>
                        <ToggleButton id="rapport">Rapport livreur</ToggleButton>
                    </ToggleButtonGroup>

                    {onglet === 'journal' ? (
                        <VueJournal
                            exportEnCours={false}
                            filtre={filtre}
                            isFetching={etat === 'chargement'}
                            isLoading={etat === 'chargement'}
                            lignes={etat === 'echec' ? [] : JEUX[jeu].journal}
                            onExporter={() => undefined}
                            setFiltre={setFiltre}
                            totalPages={JEUX[jeu].journal.length > 0 ? 4 : 0}
                        />
                    ) : (
                        <VueRapportPresence
                            debut={debut}
                            fin={fin}
                            isError={etat === 'echec'}
                            isFetching={etat === 'chargement'}
                            livreurId={livreurId}
                            livreurs={LIVREURS}
                            livreursEnCours={false}
                            onDebut={setDebut}
                            onFin={setFin}
                            onLivreur={setLivreurId}
                            onReessayer={() => undefined}
                            rapport={livreurId ? JEUX[jeu].rapport : undefined}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
