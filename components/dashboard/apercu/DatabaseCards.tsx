"use client";
import { title } from '@/components/primitives';
import { Card, Separator, Skeleton } from '@heroui-v3/react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';
import { useComptesEnAttenteQuery } from '@/features/dashboard/queries/comptes-attente.query';
import EtatErreur from '@/components/commons/EtatErreur';
import BandeauAttention, { type Signalement } from '@/components/dashboard/apercu/bandeau-attention';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-5 border-danger/40">
          <Card.Header>
            <Card.Title className="text-danger">Erreur de chargement</Card.Title>
          </Card.Header>
          <Card.Content>
            <Card.Description>Impossible de récupérer les statistiques du personnel pour le moment.</Card.Description>
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
    { label: 'Utilisateurs Actifs', value: data?.utilisateurs ?? 0, href: 'users' },
    // M1 (RG-07) — comptes livreur en attente de validation, raccourci vers la file.
    // En panne de lecture la carte sort de la liste : elle est remplacee plus bas par
    // l'etat d'echec, car un compteur a zero se lit comme "aucun compte a valider".
    ...(comptesEnAttenteEnErreur
      ? []
      : [{ label: 'Comptes en attente', value: comptesEnAttente ?? 0, href: '/delivery-men/not-valide' }]),
  ];

  /**
   * Ce qui appelle une ACTION, remonte en tete de l'ecran.
   *
   * <p>Le tableau de bord alignait une vingtaine de tuiles de poids visuel identique :
   * « Comptes en attente », qui demande une validation, s'y lisait exactement comme
   * « Partenaire Actif », qui n'appelle rien. Rien ne disait par ou commencer.</p>
   *
   * <p>Alimente UNIQUEMENT par des donnees deja chargees ici : aucun appel reseau
   * supplementaire, donc aucun cout d'affichage. Un signalement a zero n'apparait pas —
   * un bandeau qui affiche « 0 compte en attente » apprend a l'œil a l'ignorer.</p>
   */
  const signalements: Signalement[] = comptesEnAttenteEnErreur
    ? []
    : [
        {
          libelle: 'compte(s) livreur en attente de validation',
          nombre: comptesEnAttente ?? 0,
          ton: 'attention',
          href: '/delivery-men/not-valide',
        },
      ];

  return (
    <>
    <BandeauAttention signalements={signalements} />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
      {statsItems.map((item) => (
        <Card key={item.label} className="transition-shadow hover:shadow-md">
          <Card.Header>
            {/* Le libelle n'est plus en rouge : l'accent est reserve a l'action, pas au
                decor. Un titre de carte n'appelle rien. */}
            <Card.Title className="text-sm font-medium text-muted">{item.label}</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-1 overflow-x-hidden">
              <p className="text-3xl font-semibold tabular-nums">{item.value}</p>
              {item.label === 'Turboys' && (
                <div className="flex flex-col gap-2">
                  <TurboysButton name={'Indépendants'} param={'INDEPENDANT'} value={data?.turboysIndependant} />
                  <Separator />
                  <TurboysButton name={'Journaliers'} param={'JOURNALIER'} value={data?.turboysJournalier} />
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
          </Card.Content>
          {item.label !== 'Turboys' && (
            <Card.Footer>
              {/* Lien EXPLICITE, la ou la carte entiere etait cliquable sans le dire.
                  Une carte qui navigue sans l'annoncer se decouvre par accident. */}
              <Link
                className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                href={item.href ?? '#'}
              >
                Voir le détail
                <ChevronRight className="size-3.5" />
              </Link>
            </Card.Footer>
          )}
        </Card>
      ))}
      {comptesEnAttenteEnErreur && (
        <Card className="border-danger/40">
          <Card.Content className="p-0">
            <EtatErreur
              quoi="les comptes en attente"
              onReessayer={() => {
                void rechargerComptesEnAttente();
              }}
              enCours={comptesEnAttenteEnCours}
            />
          </Card.Content>
        </Card>
      )}
    </div>
    </>
  );
}
