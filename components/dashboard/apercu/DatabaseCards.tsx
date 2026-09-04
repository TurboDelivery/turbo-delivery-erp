'use client';

import { Card, Separator, Skeleton } from '@heroui-v3/react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import EtatErreur from '@/components/commons/EtatErreur';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';
import { title } from '@/components/primitives';
import { useComptesEnAttenteQuery } from '@/features/dashboard/queries/comptes-attente.query';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';

/** Grille des compteurs d'effectifs. Cinq cartes, une par population suivie. */
const GRILLE = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full';

export default function DatabaseCards() {
    const { data, isLoading, isError } = usePersonnelStatsQuery({});
    const {
        data: comptesEnAttente,
        isError: comptesEnAttenteEnErreur,
        isFetching: comptesEnAttenteEnCours,
        refetch: rechargerComptesEnAttente,
    } = useComptesEnAttenteQuery();

    if (isLoading) {
        return (
            <div className={GRILLE}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={`skeleton-${index}`}>
                        <Card.Header>
                            <Skeleton className="h-5 w-32 rounded-lg" />
                        </Card.Header>
                        <Card.Content>
                            <div className="flex flex-col gap-3">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-4 w-full rounded-lg" />
                                <Skeleton className="h-4 w-4/5 rounded-lg" />
                            </div>
                        </Card.Content>
                    </Card>
                ))}
            </div>
        );
    }

    if (isError && !data) {
        return (
            <div className={GRILLE}>
                <Card className="border border-danger/40 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                    <Card.Header>
                        <Card.Title className={title({ size: 'h6', class: 'text-danger-soft-foreground' })}>
                            Erreur de chargement
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p className="text-sm text-muted">
                            Impossible de recuperer les statistiques du personnel pour le moment.
                        </p>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    const statsItems = [
        { label: 'Partenaire Actif', value: data?.partenaireActif ?? 0, href: '/restaurants' },
        // 2026-05-29 — Carte "Turboys" pointe maintenant explicitement vers la
        // nouvelle vue /delivery-men/men. Sans href elle redirigeait vers "#"
        // (donc nulle part) et l'utilisateur restait coincé sur le dashboard.
        { label: 'Turboys', value: data?.turboys ?? 0, href: '/delivery-men/men' },
        { label: 'Personnel TURBO', value: data?.personnel ?? 0, href: '/personnel' },
        { label: 'Utilisateurs Actifs', value: data?.utilisateurs ?? 0, href: '/users' },
        // M1 (RG-07) — comptes livreur en attente de validation, raccourci vers la file.
        // En panne de lecture la carte sort de la liste : elle est remplacee plus bas par
        // l'etat d'echec, car un compteur a zero se lit comme "aucun compte a valider".
        ...(comptesEnAttenteEnErreur
            ? []
            : [{ label: 'Comptes en attente', value: comptesEnAttente ?? 0, href: '/delivery-men/not-valide' }]),
    ];

    return (
        <div className={GRILLE}>
            {statsItems.map((item) => (
                <Link className="block h-full" href={item.href ?? '#'} key={item.label}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                        <Card.Header>
                            <Card.Title className={title({ size: 'h6', class: 'text-primary' })}>
                                {item.label}
                            </Card.Title>
                        </Card.Header>
                        <Card.Content className="flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between gap-1 overflow-x-hidden">
                                <p className={title({ size: 'h4' })}>{item.value}</p>
                                {item.label === 'Turboys' && (
                                    <div className="flex flex-col gap-2">
                                        <TurboysButton
                                            name={'Indépendants'}
                                            param={'INDEPENDANT'}
                                            value={data?.turboysIndependant}
                                        />
                                        <Separator />
                                        <TurboysButton
                                            name={'Journaliers'}
                                            param={'JOURNALIER'}
                                            value={data?.turboysJournalier}
                                        />
                                        {/* V54 (2026-05) — Affiche la 3e population SUPERVISEUR_LIVREUR
                                            quand l'API la renvoie. Si l'utilisateur est sur un front
                                            qui a tapé un backend pré-V54, le champ est undefined et
                                            on n'affiche rien — comportement gracieux. */}
                                        {data?.turboysSuperviseurLivreur !== undefined && (
                                            <>
                                                <Separator />
                                                <TurboysButton
                                                    name={'Superviseurs-livreurs'}
                                                    param={'SUPERVISEUR_LIVREUR'}
                                                    value={data.turboysSuperviseurLivreur}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {item.label !== 'Turboys' && (
                                <div className="flex items-center gap-1 text-xs text-muted">
                                    <span>Voir le détail</span>
                                    <ChevronRight className="size-3.5" />
                                </div>
                            )}
                        </Card.Content>
                    </Card>
                </Link>
            ))}
            {/* Forme COMPACTE : cette case vaut un compteur, pas un bloc de contenu. La
                forme centree tient 200 px de haut — une icone de 40 px, un titre sur deux
                lignes, une explication, un bouton — et faisait de la seule case en panne
                l'element le plus voyant d'une rangee de cinq chiffres. L'information est
                la meme, elle cesse de crier. Elle porte deja sa bordure et son fond, donc
                pas de `Card` autour. */}
            {comptesEnAttenteEnErreur && (
                <div className="flex items-center">
                    <EtatErreur
                        compact
                        enCours={comptesEnAttenteEnCours}
                        onReessayer={() => {
                            void rechargerComptesEnAttente();
                        }}
                        quoi="les comptes en attente"
                    />
                </div>
            )}
        </div>
    );
}
