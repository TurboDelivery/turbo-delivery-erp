'use client';

import { Button, Card, Separator } from '@heroui-v3/react';
import { ArrowDownRight, Banknote, Clock, TrendingUp, Wallet } from 'lucide-react';

import { Ecart } from '@/components/commons/ecart';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useState } from 'react';

import { JEUX_EXEMPLE, jeuParCle } from '@/features/finance-dashboard/apercu/jeux-exemple';
import { BandePerimetre } from '@/features/finance-dashboard/components/etat/bande-perimetre';
import { CarteIndicateur } from '@/features/finance-dashboard/components/etat/carte-indicateur';
import { GraphiqueMensuel } from '@/features/finance-dashboard/components/etat/graphique-mensuel';
import { DisponibiliteJour, RepartitionParc } from '@/features/finance-dashboard/components/etat/repartition-parc';
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
            incise: 'la carte du trafic est vide',
            libelleAction: 'Voir le trafic',
            actif: voitLivreurs && t.horsService > 0,
        },
        {
            cle: 'dispo',
            titre: 'Aucun livreur disponible',
            consequence: `Personne n'est en file sur ${t.totalLivreurs} livreurs : soit la journée n'a pas commencé, soit le pointage ne remonte plus. Les offres de course ne partiront pas.`,
            href: '/delivery-men/pointages-a-valider',
            incise: 'les offres ne partiront pas',
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
            incise: 'ils ne peuvent pas se connecter',
            libelleAction: 'Valider les comptes',
            actif: voitLivreurs && jeu.comptesEnAttente > 0,
        },
        {
            cle: 'creneau',
            titre: `Verrouillage des tickets dans ${heures} h`,
            consequence: `Semaine ${jeu.creneau.semaine}, ${jeu.creneau.ticketsSaisis} tickets saisis. Après le verrouillage, plus aucune saisie n'est possible sur la semaine.`,
            href: '/validation-tickets',
            incise: `semaine ${jeu.creneau.semaine}`,
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
                <main className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold">Pilotage Turbo Delivery</h1>
                            <p className="text-sm text-muted">Du 1<sup>er</sup> au 30 septembre 2026</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg border border-separator p-1">
                            {['Ce mois', '2026', "Depuis l'origine"].map((p, k) => (
                                <button
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                        k === 0 ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                                    )}
                                    key={p}
                                    type="button"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <BandeauAction elements={actions} />

                    {voitFinance && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <CarteIndicateur
                                href="/finance/revenue"
                                icone={Wallet}
                                libelle="Chiffre d'affaires"
                                libelleReference="vs août"
                                reference={jeu.statsPeriodePrecedente.chiffreAffaire}
                                sens="favorable"
                                valeur={jeu.statsGlobales.chiffreAffaire}
                            />
                            <CarteIndicateur
                                contexte={jeu.resume.totalDepenses === 0 ? 'aucune charge imputée' : undefined}
                                href="/finance/dashboard"
                                icone={ArrowDownRight}
                                libelle="Dépenses"
                                libelleReference="vs août"
                                reference={jeu.statsPeriodePrecedente.depenses}
                                sens="defavorable"
                                valeur={jeu.resume.totalDepenses}
                            />
                            <CarteIndicateur
                                contexte={resultat >= 0 ? 'excédent' : 'déficit'}
                                href="/finance/analyse-rentabilite"
                                icone={TrendingUp}
                                libelle="Marge"
                                libelleReference="vs août"
                                principal
                                reference={resultatPrecedent}
                                sens="favorable"
                                tonContexte={resultat >= 0 ? 'favorable' : 'attention'}
                                valeur={resultat}
                            />
                            <CarteIndicateur
                                contexte={
                                    jeu.statsGlobales.chiffreAffaire
                                        ? `${Math.round((jeu.resume.totalFacturesEnCours / jeu.statsGlobales.chiffreAffaire) * 100)} % du CA du mois`
                                        : undefined
                                }
                                href="/finance/recouvrement?tab=factures"
                                icone={Clock}
                                libelle="Encours à recouvrer"
                                tonContexte="attention"
                                valeur={jeu.resume.totalFacturesEnCours}
                            />
                        </div>
                    )}

                    {voitFinance && (
                        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                            <Card className="lg:col-span-2">
                                <Card.Header>
                                    <Card.Title className="text-sm">Revenus et dépenses par mois · 2026</Card.Title>
                                    <Card.Description>
                                        La marge, en surimpression, est la différence des deux barres.
                                    </Card.Description>
                                </Card.Header>
                                {/*
                                 * Hauteur DEFINIE, pas `flex-1` : le `ResponsiveContainer` de
                                 * Recharts mesure son parent, et un enfant flexible sans hauteur
                                 * resolue lui en donne zero. Mesure a l'ecran : la carte faisait
                                 * 487 px et le graphique 0.
                                 */}
                                <Card.Content>
                                    <GraphiqueMensuel donnees={jeu.serieAnnuelle} hauteur={340} />
                                </Card.Content>
                            </Card>

                            <Card>
                                <Card.Header>
                                    <Card.Title className="text-sm">Détail du mois</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    <EtatFinancier
                                        libellePeriode="Septembre"
                                        masquerCumul
                                        sections={sections}
                                    />
                                </Card.Content>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm">
                                    Répartition du parc · {jeu.effectifs.turboys} turboys
                                </Card.Title>
                            </Card.Header>
                            <Card.Content>
                                <RepartitionParc
                                    parts={[
                                        { libelle: 'Indépendants', valeur: jeu.effectifs.turboysIndependant, couleur: '#2563eb' },
                                        { libelle: 'Journaliers', valeur: jeu.effectifs.turboysJournalier, couleur: '#d97706' },
                                        { libelle: 'Superviseurs-livreurs', valeur: jeu.effectifs.turboysSuperviseurLivreur ?? 0, couleur: '#15803d' },
                                    ]}
                                />
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm">Disponibilité du jour</Card.Title>
                                <Card.Description>
                                    {t.horsService} livreurs sur {t.totalLivreurs} n&apos;ont aucune position connue.
                                </Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <DisponibiliteJour
                                    barres={[
                                        { libelle: 'En course', valeur: t.enActivite, couleur: '#2563eb' },
                                        { libelle: 'Disponibles', valeur: t.disponibles, couleur: '#15803d' },
                                        { libelle: 'Hors service', valeur: t.horsService, couleur: '#b91c1c' },
                                    ]}
                                    total={t.totalLivreurs}
                                />
                            </Card.Content>
                        </Card>
                    </div>

                    <BandePerimetre reperes={reperes} />
                </main>
            </div>
        </div>
    );
}
