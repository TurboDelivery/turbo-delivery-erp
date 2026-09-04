'use client';

import { Button, Card, Separator } from '@heroui-v3/react';
import { Download } from 'lucide-react';

import { Ecart } from '@/components/commons/ecart';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useState } from 'react';

import { JEUX_EXEMPLE, jeuParCle } from '@/features/finance-dashboard/apercu/jeux-exemple';
import { BandePerimetre } from '@/features/finance-dashboard/components/etat/bande-perimetre';
import { BandeauAction } from '@/features/finance-dashboard/components/etat/bandeau-action';
import { construireEtat } from '@/features/finance-dashboard/components/etat/construire-etat';
import { EtatFinancier } from '@/features/finance-dashboard/components/etat/etat-financier';
import { defineAbilityFor, type AppRole } from '@/lib/casl/ability';
import { cn } from '@/lib/utils';

/**
 * Prevalisation du tableau de bord propose.
 *
 * <p>La barre du haut n'appartient PAS a l'ecran : elle sert a le regarder dans les etats
 * qu'on oublie de verifier — periode vide, deficit, valeurs extremes, theme sombre, et
 * role de l'utilisateur. Tout ce qui est SOUS elle est l'ecran lui-meme.</p>
 */

/** Deux roles qui lisent la finance, deux qui n'en ont pas le droit. */
const ROLES_MONTRES: AppRole[] = ['COMPTABLE', 'DG', 'OPS_MANAGER', 'DIRECTEUR_OPERATIONS'];

export default function ApercuContenu() {
    const [cle, setCle] = useState('ordinaire');
    const [sombre, setSombre] = useState(false);
    const [role, setRole] = useState<AppRole>('COMPTABLE');
    const jeu = jeuParCle(cle);

    // Dates fixes : `new Date()` au rendu ferait diverger serveur et client.
    const debut = new Date('2026-09-01');
    const fin = new Date('2026-09-30');

    // Le VRAI moteur d'habilitation du projet, pas une imitation.
    const ability = defineAbilityFor(role);
    const voitFinance = ability.can('read', 'Finance');
    const voitLivreurs = ability.can('read', 'Livreur');

    // Le resultat, calcule ici pour etre ENONCE en tete.
    const resultat = jeu.statsGlobales.chiffreAffaire - jeu.resume.totalDepenses;
    const resultatPrecedent = jeu.statsPeriodePrecedente.chiffreAffaire - jeu.statsPeriodePrecedente.depenses;

    const sections = construireEtat({
        statsGlobales: jeu.statsGlobales,
        statsPeriodePrecedente: jeu.statsPeriodePrecedente,
        resume: jeu.resume,
        depenses: jeu.depenses,
        debut,
        fin,
    });

    const reperes = [
        { cle: 'partenaires', libelle: 'Partenaires actifs', valeur: jeu.effectifs.partenaireActif, href: '/restaurants' },
        {
            cle: 'turboys',
            libelle: 'Turboys',
            valeur: jeu.effectifs.turboys,
            href: '/delivery-men/men',
            details: [
                { libelle: 'Indép.', valeur: jeu.effectifs.turboysIndependant, href: '/delivery-men/men?typeLivreur=INDEPENDANT&tab=independant' },
                { libelle: 'Journ.', valeur: jeu.effectifs.turboysJournalier, href: '/delivery-men/men?typeLivreur=JOURNALIER&tab=journalier' },
                ...(jeu.effectifs.turboysSuperviseurLivreur !== undefined
                    ? [{ libelle: 'Superv.', valeur: jeu.effectifs.turboysSuperviseurLivreur, href: '/delivery-men/men?typeLivreur=SUPERVISEUR_LIVREUR&tab=superviseur_livreur' }]
                    : []),
            ],
        },
        { cle: 'personnel', libelle: 'Personnel Turbo', valeur: jeu.effectifs.personnel, href: '/personnel' },
        { cle: 'utilisateurs', libelle: 'Utilisateurs actifs', valeur: jeu.effectifs.utilisateurs, href: '/users' },
    ];

    // Les alertes d'exploitation. Toutes adossees a des requetes qui existent deja :
    // `useTraficLivreursQuery` pour l'etat du terrain, `useCreneauActifQuery` pour le
    // verrouillage. C'est ce que les maquettes avaient trouve de juste et que la
    // premiere version de cet ecran avait laisse tomber.
    const t = jeu.trafic;
    const heures = jeu.creneau.heuresAvantVerrouillage;

    const actions = [
        {
            cle: 'gps',
            titre: `${t.horsService} livreurs sans position GPS`,
            consequence: `Sur ${t.totalLivreurs} livreurs, autant n'apparaissent nulle part sur la carte du trafic : on ne peut ni les affecter, ni voir où ils sont.`,
            href: '/trafic',
            libelleAction: 'Voir le trafic',
            actif: voitLivreurs && t.horsService > 0,
        },
        {
            cle: 'dispo',
            titre: 'Aucun livreur disponible',
            consequence: `Personne n'est en file sur ${t.totalLivreurs} livreurs : soit la journée n'a pas commencé, soit le pointage ne remonte plus. Les offres de course ne partiront pas.`,
            href: '/delivery-men/pointages-a-valider',
            libelleAction: 'Vérifier les pointages',
            actif: voitLivreurs && t.disponibles === 0,
        },
        {
            cle: 'comptes',
            titre:
                jeu.comptesEnAttente > 1
                    ? `${jeu.comptesEnAttente} comptes livreurs attendent une validation`
                    : '1 compte livreur attend une validation',
            consequence: "Tant que le compte n'est pas validé, le livreur ne peut pas se connecter à l'application.",
            href: '/delivery-men/not-valide',
            libelleAction: 'Valider les comptes',
            actif: voitLivreurs && jeu.comptesEnAttente > 0,
        },
        {
            cle: 'creneau',
            titre: `Verrouillage des tickets dans ${heures} h`,
            consequence: `Semaine ${jeu.creneau.semaine}, ${jeu.creneau.ticketsSaisis} tickets saisis. Après le verrouillage, plus aucune saisie n'est possible sur la semaine.`,
            href: '/validation-tickets',
            libelleAction: 'Saisir les tickets',
            actif: jeu.creneau.statut === 'OUVERT' && heures <= 48,
        },
    ];

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                {/* Barre de contrôle de la prévisualisation — ne fait pas partie de l'écran. */}
                <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-separator bg-surface px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">Aperçu</span>
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {JEUX_EXEMPLE.map((j) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                j.cle === cle ? 'bg-accent text-white' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                            )}
                            key={j.cle}
                            onClick={() => setCle(j.cle)}
                            title={j.intitule}
                            type="button"
                        >
                            {j.cle}
                        </button>
                    ))}
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {ROLES_MONTRES.map((r) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                r === role ? 'bg-foreground text-background' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                            )}
                            key={r}
                            onClick={() => setRole(r)}
                            type="button"
                        >
                            {r}
                        </button>
                    ))}
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    <button
                        className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:bg-surface-secondary hover:text-foreground"
                        onClick={() => setSombre((v) => !v)}
                        type="button"
                    >
                        {sombre ? 'sombre' : 'clair'}
                    </button>
                    <span className="ms-auto text-xs text-muted">{jeu.intitule}</span>
                </header>

                {/* ══ L'ÉCRAN PROPOSÉ COMMENCE ICI ══ */}
                <main className="mx-auto flex max-w-[1100px] flex-col gap-4 p-4">
                    <BandeauAction elements={actions} />

                    <BandePerimetre reperes={reperes} />

                    {voitFinance ? (
                        <Card>
                            {/*
                             * Le RESULTAT est enonce ici, pas au terme du tableau. Mesure a la
                             * taille reelle du poste (720 x 563), la ligne « Resultat » tombait a
                             * 796 px : ce que la conception designe comme le premier regard
                             * demandait de defiler. Le document annonce donc sa conclusion, et le
                             * tableau en dessous montre comment on y arrive.
                             */}
                            <Card.Header>
                                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                                    <div className="min-w-0">
                                        <Card.Title className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                                            Résultat · septembre 2026
                                        </Card.Title>
                                        <p
                                            className={cn(
                                                'mt-0.5 text-3xl font-bold tabular-nums',
                                                resultat < 0 && 'text-red-800 dark:text-red-400',
                                            )}
                                        >
                                            {formatCFA(resultat).replace(/^[-\u2212]/, '\u2212')}
                                        </p>
                                        <span className="mt-1 flex items-center gap-2">
                                            <Ecart
                                                libelleReference="vs août"
                                                reference={resultatPrecedent}
                                                sens="favorable"
                                                valeur={resultat}
                                            />
                                        </span>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Download aria-hidden="true" className="size-4" />
                                        Télécharger les détails
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Content>
                                <EtatFinancier
                                    libelleCumul="Depuis 2024"
                                    libellePeriode="Septembre 2026"
                                    libelleReference="vs août"
                                    sections={sections}
                                />
                            </Card.Content>
                        </Card>
                    ) : (
                        <Card variant="secondary">
                            <Card.Content className="py-6 text-center">
                                <p className="text-sm text-muted">
                                    Le rôle <span className="font-semibold text-foreground">{role}</span> n&apos;a pas
                                    le droit de lire les données financières. L&apos;écran actuel les lui montre
                                    quand même.
                                </p>
                            </Card.Content>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}
