'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import type { IPointageHorsZone } from '@/features/pointages-validation/pointages-validation.api';
import { FileArbitrage } from '@/features/pointages/refonte/file-arbitrage';

/** Le banc de la file d'arbitrage : quatre jeux d'essai, deux thèmes, trois états. */

const LIVREURS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou',
];

const RESTOS = ['Chez Paul, Cocody', 'Le Bistrot, Plateau', 'Kfc Marcory', 'La Villa, Riviera'];

const MOTIFS = [
    'Panne de moto, je suis parti au garage le plus proche pour la réparer avant de reprendre le service.',
    'Le restaurant était fermé, j’ai attendu de l’autre côté de la rue.',
    '',
    'Embouteillage sur le boulevard, je me suis garé pour pointer.',
];

const TYPES = ['START', 'MID', 'MID2', 'END'] as const;

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, nb: number, tousTranches: boolean): IPointageHorsZone[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    return Array.from({ length: nb }).map((_, i) => {
        const r = suivant();
        const validation = tousTranches
            ? r < 0.55
                ? 'VALIDE'
                : 'REJETE'
            : r < 0.45
              ? 'EN_ATTENTE'
              : r < 0.75
                ? 'VALIDE'
                : 'REJETE';
        const jour = 1 + Math.floor(suivant() * 28);
        const distance = Math.round(suivant() ** 2 * 4200);
        return {
            arbitre: validation === 'EN_ATTENTE' ? null : suivant() < 0.2 ? null : 'KOUASSI Anne',
            commentaireValidation:
                validation === 'REJETE' ? 'Aucune preuve exploitable, hors zone de plus d’un kilomètre.' : null,
            date: `2026-08-${String(jour).padStart(2, '0')}`,
            distanceMetres: suivant() < 0.08 ? null : distance,
            emploiId: `e${i}`,
            latitude: suivant() < 0.1 ? null : 5.3 + suivant() * 0.1,
            livreur: LIVREURS[i % LIVREURS.length],
            livreurId: `l${i % LIVREURS.length}`,
            longitude: -4.02 + suivant() * 0.1,
            motif: MOTIFS[i % MOTIFS.length],
            pointeAt: `2026-08-${String(jour).padStart(2, '0')}T0${5 + (i % 4)}:${String(10 + (i % 45)).padStart(2, '0')}:00`,
            preuveUrl: suivant() < 0.55 ? `preuve-${i}.jpg` : null,
            restaurant: RESTOS[i % RESTOS.length],
            statut: 'LATE',
            type: TYPES[i % TYPES.length],
            validation,
            valideAt: validation === 'EN_ATTENTE' ? null : `2026-08-${String(jour).padStart(2, '0')}T12:00:00`,
        } satisfies IPointageHorsZone;
    });
}

const JEUX = {
    ordinaire: { libelle: 'Registre ordinaire', lignes: fabriquer(11, 14, false) },
    charge: { libelle: 'File chargée', lignes: fabriquer(37, 40, false) },
    videFile: { libelle: 'Rien à trancher', lignes: fabriquer(23, 10, true) },
    vide: { libelle: 'Registre vide', lignes: [] as IPointageHorsZone[] },
};

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

export default function ApercuPointages() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = useThemeSombre();
    const [depuis, setDepuis] = React.useState('');
    const [journal, setJournal] = React.useState<string[]>([]);

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Pointages</span>
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

                {journal.length > 0 && (
                    <p className="border-b border-separator px-4 py-1 text-xs text-muted">
                        {journal[journal.length - 1]}
                    </p>
                )}

                <main className="mx-auto max-w-[1400px] p-4">
                    <FileArbitrage
                        depuis={depuis}
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        onDepuis={setDepuis}
                        onReessayer={() => setJournal((j) => [...j, 'Relecture demandée'])}
                        onRejeter={(p, motif) =>
                            setJournal((j) => [...j, `Rejet de ${p.livreur} — « ${motif} »`])
                        }
                        onValider={(p) => setJournal((j) => [...j, `Validation de ${p.livreur}`])}
                        pointages={JEUX[jeu].lignes}
                        // Une image d'essai stable et hors ligne : un carré uni en SVG.
                        urlPreuve={(chemin) =>
                            `data:image/svg+xml;utf8,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#d4d4d8"/><text x="60" y="64" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#3f3f46">${chemin}</text></svg>`,
                            )}`
                        }
                    />
                </main>
            </div>
        </div>
    );
}
