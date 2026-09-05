'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { SemaineProgrammes } from '@/features/programmes/refonte/semaine-programmes';
import type {
    IAutosuffisanceJour,
    IJourProgramme,
    IProgramme,
    StatutProgramme,
} from '@/features/turboys/types/programme.types';

/** Le banc de la semaine des programmes : quatre jeux d'essai, deux thèmes, trois états. */

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
    'SANOGO Karim', 'FOFANA Aboubacar', 'TOURE Bakary', 'CISSE Yacouba',
];

const RESTOS = ['Chez Paul, Cocody', 'Le Bistrot, Plateau', 'Kfc Marcory', 'La Villa, Riviera'];
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const TYPES = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, nb: number, statuts: StatutProgramme[]): IProgramme[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    return Array.from({ length: nb }).map((_, i) => {
        const statut = statuts[Math.floor(suivant() * statuts.length)];
        const jours: IJourProgramme[] = JOURS.map((j, k) => {
            const actif = suivant() > 0.22;
            return {
                actif,
                date: `2026-08-${String(24 + k).padStart(2, '0')}`,
                debut: actif ? `0${6 + (k % 3)}:00:00` : null,
                fin: actif ? `1${6 + (k % 3)}:30:00` : null,
                jour: j,
                postes: actif ? [{ restaurantId: `r${i % RESTOS.length}`, restaurantNom: RESTOS[i % RESTOS.length] }] : [],
            };
        });
        return {
            accepteLe: null,
            annee: 2026,
            id: `p${graine}-${i}`,
            jours,
            livreurId: `l${i}`,
            livreurNom: NOMS[i % NOMS.length],
            motifRefus: statut === 'REFUSE' ? 'Je suis en congé cette semaine, je l’avais signalé au superviseur.' : null,
            nbRelances: 0,
            publieLe: null,
            refuseLe: null,
            semaine: 35,
            source: 'ERP',
            statut,
            typeLivreur: TYPES[i % TYPES.length],
        } satisfies IProgramme;
    });
}

const AUTOSUFFISANCE: IAutosuffisanceJour[] = JOURS.map((j, k) => {
    const independants = 4 + ((k * 3) % 7);
    const planifies = 9 + ((k * 5) % 11);
    return { independants, jour: j, planifies, total: independants + planifies };
});

const JEUX = {
    ordinaire: {
        libelle: 'Semaine ordinaire',
        lignes: fabriquer(11, 14, ['BROUILLON', 'PLANIFIE', 'NOTIFIE', 'ACCEPTE', 'REFUSE']),
    },
    aPublier: { libelle: 'Tout à publier', lignes: fabriquer(29, 12, ['BROUILLON', 'PLANIFIE']) },
    publiee: { libelle: 'Semaine lancée', lignes: fabriquer(41, 12, ['NOTIFIE', 'ACCEPTE']) },
    vide: { libelle: 'Aucun programme', lignes: [] as IProgramme[] },
};

const INDEPENDANTS = fabriquer(97, 5, ['ACCEPTE']);

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

export default function ApercuProgrammes() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = useThemeSombre();
    const [semaine, setSemaine] = React.useState(35);
    const [type, setType] = React.useState('TOUS');
    const [partenaire, setPartenaire] = React.useState('TOUS');
    const [journal, setJournal] = React.useState<string[]>([]);
    const noter = (m: string) => setJournal((j) => [...j, m]);

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Programmes</span>
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

                <main className="mx-auto max-w-[1600px] p-4">
                    <SemaineProgrammes
                        annee={2026}
                        autosuffisance={AUTOSUFFISANCE}
                        autosuffisanceIsError={etat === 'echec'}
                        autosuffisanceIsLoading={etat === 'chargement'}
                        independants={INDEPENDANTS}
                        independantsIsError={etat === 'echec'}
                        independantsIsLoading={etat === 'chargement'}
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        onApercu={(p) => noter(`Aperçu de ${p.livreurNom}`)}
                        onCopierSemainePrecedente={() => noter('Copie de la semaine précédente')}
                        onEditer={(p) => noter(`Édition de ${p.livreurNom}`)}
                        onEnvoyer={(p) => noter(`Envoi au livreur ${p.livreurNom}`)}
                        onExporterExcel={() => noter('Export Excel')}
                        onExporterPdf={() => noter('Export PDF')}
                        onImporterFichier={() => noter('Import de fichier')}
                        onNouveau={() => noter('Nouveau programme')}
                        onPartenaireFiltre={setPartenaire}
                        onPlanifier={(p) => noter(`Planification de ${p.livreurNom}`)}
                        onPublier={(p) => noter(`Publication de ${p.livreurNom}`)}
                        onPublierLot={(ids) => noter(`Publication en lot de ${ids.length} programme(s)`)}
                        onReessayer={() => noter('Relecture demandée')}
                        onReessayerIndependants={() => noter('Relecture des indépendants')}
                        onSemaine={(d) => setSemaine((s) => s + d)}
                        onSupprimer={(p) => noter(`Suppression de ${p.livreurNom}`)}
                        onTelechargerModele={() => noter('Téléchargement du modèle')}
                        onTypeFiltre={setType}
                        partenaireFiltre={partenaire}
                        partenaires={RESTOS.map((r, i) => ({ id: `r${i}`, nom: r }))}
                        programmes={JEUX[jeu].lignes}
                        semaine={semaine}
                        typeFiltre={type}
                        typeOptions={[
                            { cle: 'TOUS', libelle: 'Tous' },
                            { cle: 'JOURNALIER', libelle: 'Journaliers' },
                            { cle: 'SUPERVISEUR_LIVREUR', libelle: 'Superviseurs' },
                            { cle: 'INDEPENDANT', libelle: 'Indépendants' },
                        ]}
                    />
                </main>
            </div>
        </div>
    );
}
