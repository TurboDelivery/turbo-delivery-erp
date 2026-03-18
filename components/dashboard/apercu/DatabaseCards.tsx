import { title } from '@/components/primitives';
import { Card, CardBody, CardHeader, Divider, Skeleton } from '@heroui/react';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';

export default function DatabaseCards() {
  const { data, isLoading, isError } = usePersonnelStatsQuery({});
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, index) => (
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="md:col-span-2 lg:col-span-4 border-danger/40">
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
    { label: 'Partenaire Actif', value: data?.partenaireActif ?? 0 },
    { label: 'Turboys', value: data?.turboys ?? 0 },
    { label: 'Personnel TURBO', value: data?.personnel ?? 0 },
    { label: 'Utilisateurs Actifs', value: data?.utilisateurs ?? 0 },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {statsItems.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <h3 className={title({ size: 'h6', class: 'text-primary' })}>{item.label}</h3>
          </CardHeader>
          <CardBody>
            <div className="flex justify-between gap-1 items-center overflow-x-hidden">
              <p className={title({ size: 'h4' })}>{item.value}</p>
              {item.label === 'Turboys' && (
                <div className="flex flex-col gap-2">
                  <TurboysButton name={'Indépendants'} param={'INDEPENDANT'} value={data?.turboysIndependant} />
                  <Divider />
                  <TurboysButton name={'Journaliers'} param={'JOURNALIER'} value={data?.turboysJournalier} />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
