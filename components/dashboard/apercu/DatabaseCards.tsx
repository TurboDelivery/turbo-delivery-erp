"use client";
import { title } from '@/components/primitives';
import { Card, CardBody, CardHeader, Divider, Link, Skeleton } from '@heroui/react';
import { ChevronRight } from 'lucide-react';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';
import { useComptesEnAttenteQuery } from '@/features/dashboard/queries/comptes-attente.query';

export default function DatabaseCards() {
  const { data, isLoading, isError } = usePersonnelStatsQuery({});
  const { data: comptesEnAttente } = useComptesEnAttenteQuery();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <CardHeader>
              <Skeleton className="h-5 w-32 rounded-lg" />
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-5 border-danger/40">
          <CardHeader>
            <h3 className={title({ size: 'h6', class: 'text-danger' })}>Erreur de chargement</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-foreground-600">Impossible de recuperer les statistiques du personnel pour le moment.</p>
          </CardBody>
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
    { label: 'Comptes en attente', value: comptesEnAttente ?? 0, href: '/delivery-men/not-valide' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
      {statsItems.map((item) => (
        <Card as={Link} key={item.label} href={item.href ?? '#'} className="transition-shadow hover:shadow-md">
          <CardHeader>
            <h3 className={title({ size: 'h6', class: 'text-primary' })}>{item.label}</h3>
          </CardHeader>
          <CardBody className="flex flex-col justify-between gap-3">
            <div className="flex justify-between gap-1 items-center overflow-x-hidden">
              <p className={title({ size: 'h4' })}>{item.value}</p>
              {item.label === 'Turboys' && (
                <div className="flex flex-col gap-2">
                  <TurboysButton name={'Indépendants'} param={'INDEPENDANT'} value={data?.turboysIndependant} />
                  <Divider />
                  <TurboysButton name={'Journaliers'} param={'JOURNALIER'} value={data?.turboysJournalier} />
                  {/* V54 (2026-05) — Affiche la 3e population SUPERVISEUR_LIVREUR
                       quand l'API la renvoie. Si l'utilisateur est sur un front
                       qui a tapé un backend pré-V54, le champ est undefined et
                       on n'affiche rien — comportement gracieux. */}
                  {data?.turboysSuperviseurLivreur !== undefined && (
                    <>
                      <Divider />
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
              <div className="flex items-center gap-1 text-xs text-default-400">
                <span>Voir le détail</span>
                <ChevronRight className="size-3.5" />
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
