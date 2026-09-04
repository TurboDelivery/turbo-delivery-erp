'use client';

import { Card, Separator } from '@heroui-v3/react';
import { useState } from 'react';

import { Ecart } from '@/components/commons/ecart';
import { Effectif, Montant } from '@/components/commons/montant';
import { JEUX_EXEMPLE, jeuParCle } from '@/features/finance-dashboard/apercu/jeux-exemple';
import { cn } from '@/lib/utils';

/** Bascule de jeu de donnees et de theme, pour verifier les deux d'un meme geste. */
export default function ApercuContenu() {
    const [cle, setCle] = useState('ordinaire');
    const [sombre, setSombre] = useState(false);
    const jeu = jeuParCle(cle);

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-separator bg-surface px-4 py-3">
                    <span className="text-sm font-semibold">Prévisualisation</span>
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {JEUX_EXEMPLE.map((j) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                j.cle === cle
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:bg-surface-secondary hover:text-foreground',
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
                    <button
                        className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:bg-surface-secondary hover:text-foreground"
                        onClick={() => setSombre((v) => !v)}
                        type="button"
                    >
                        {sombre ? 'thème sombre' : 'thème clair'}
                    </button>
                    <span className="ms-auto text-xs text-muted">{jeu.intitule}</span>
                </header>

                <main className="space-y-6 p-4">
                    <Card>
                        <Card.Header>
                            <Card.Title>Montants alignés</Card.Title>
                            <Card.Description>
                                Chasse tabulaire et alignement à droite : les ordres de grandeur tombent
                                les uns sous les autres.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div className="max-w-md space-y-1">
                                {[
                                    ["Chiffre d'affaires", jeu.statsGlobales.chiffreAffaire],
                                    ['Frais de livraison', jeu.statsGlobales.fraisLivraison],
                                    ['Commissions', jeu.statsGlobales.commission],
                                    ['Dépenses', jeu.resume.totalDepenses],
                                    ['Encours', jeu.resume.totalFacturesEnCours],
                                    ['Investissements', jeu.resume.totalInvestissements],
                                ].map(([libelle, valeur]) => (
                                    <div className="flex items-baseline justify-between gap-6" key={libelle as string}>
                                        <span className="text-sm text-muted">{libelle}</span>
                                        <Montant attenuerSiNul taille="md" valeur={valeur as number} />
                                    </div>
                                ))}
                            </div>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title>Écarts avec la période précédente</Card.Title>
                            <Card.Description>
                                La flèche suit le signe réel ; seule la couleur suit ce qu&apos;une hausse
                                veut dire pour cette grandeur-là.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div className="max-w-lg space-y-2">
                                {[
                                    ["Chiffre d'affaires", jeu.statsGlobales.chiffreAffaire, jeu.statsPeriodePrecedente.chiffreAffaire, 'favorable'],
                                    ['Dépenses', jeu.statsGlobales.depenses, jeu.statsPeriodePrecedente.depenses, 'defavorable'],
                                    ['Commissions', jeu.statsGlobales.commission, jeu.statsPeriodePrecedente.commission, 'favorable'],
                                    ['Investissements', jeu.statsGlobales.investissement, jeu.statsPeriodePrecedente.investissement, 'neutre'],
                                    ['Sans référence disponible', jeu.statsGlobales.solde, undefined, 'neutre'],
                                ].map(([libelle, v, ref, sens]) => (
                                    <div className="flex items-baseline justify-between gap-6" key={libelle as string}>
                                        <span className="text-sm text-muted">{libelle as string}</span>
                                        <span className="flex items-baseline gap-3">
                                            <Montant attenuerSiNul valeur={v as number} />
                                            <Ecart
                                                libelleReference="vs période précédente"
                                                reference={ref as number | undefined}
                                                sens={sens as 'favorable' | 'defavorable' | 'neutre'}
                                                valeur={v as number}
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title>Effectifs</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <div className="max-w-md space-y-1">
                                {[
                                    ['Partenaires actifs', jeu.effectifs.partenaireActif],
                                    ['Turboys', jeu.effectifs.turboys],
                                    ['— indépendants', jeu.effectifs.turboysIndependant],
                                    ['— journaliers', jeu.effectifs.turboysJournalier],
                                    ['— superviseurs-livreurs', jeu.effectifs.turboysSuperviseurLivreur ?? 0],
                                    ['Personnel Turbo', jeu.effectifs.personnel],
                                    ['Utilisateurs actifs', jeu.effectifs.utilisateurs],
                                    ['Comptes en attente', jeu.comptesEnAttente],
                                ].map(([libelle, valeur]) => (
                                    <div className="flex items-baseline justify-between gap-6" key={libelle as string}>
                                        <span className="text-sm text-muted">{libelle as string}</span>
                                        <Effectif taille="md" valeur={valeur as number} />
                                    </div>
                                ))}
                            </div>
                        </Card.Content>
                    </Card>
                </main>
            </div>
        </div>
    );
}
