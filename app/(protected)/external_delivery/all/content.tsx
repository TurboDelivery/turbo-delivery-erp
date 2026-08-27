'use client';

import { useMemo, useState } from 'react';
import { Button, Chip, Input, Pagination, Skeleton } from '@/components/heroui';
import { Search } from 'lucide-react';

import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneAutreStatus } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import CourseCard from '../component/course-card';
import { COURSE_STATUT_LABELS } from '../component/course-statut';

const FILTRES: { id: string; name: string }[] = [
  { id: 'all', name: 'Toutes' },
  ...Object.entries(COURSE_STATUT_LABELS).map(([id, name]) => ({ id, name })),
];

interface Props {
  initialData: PaginatedResponse<CourseExterne>;
  delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  // initialData a null vaut echec de lecture : l'action serveur renvoie null sur
  // exception, alors qu'une liste reellement vide renvoie un contenu vide.
  const [isError, setIsError] = useState(!initialData);
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  // Filtres appliqués côté client sur la page chargée (statut + code / partenaire).
  const courses = useMemo(() => {
    let list = data?.content ?? [];
    if (statusFilter !== 'all') list = list.filter((c) => c.statut?.toUpperCase() === statusFilter);
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.code?.toLowerCase().includes(q) ||
          c.restaurant?.nomEtablissement?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, statusFilter, searchTerm]);

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getPaginationCourseExterneAutreStatus(page - 1, pageSize);
      // newData a null = lecture en echec. Retomber sur initialData afficherait la
      // premiere page a la place de celle demandee, sans le dire.
      if (!newData) {
        setIsError(true);
        return;
      }
      setData(newData);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Toutes les courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historique des courses du canal intégration (assignées, en livraison, terminées, annulées).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip variant="flat">{data?.totalElements ?? 0} course{(data?.totalElements ?? 0) > 1 ? 's' : ''}</Chip>
          {/* Bouton « Nouvelle course » RETIRE : il pointait vers /delivery/create,
              route qui n'existe pas (il y a `delivery-men`, pas `delivery`) — le clic
              donnait un 404 plein ecran. Verifie : aucune page de creation de course
              dans l'ERP, aucune modale dans external_delivery/, et
              src/actions/courses.actions.ts n'expose aucune action de creation. Les
              courses entrent par le canal d'integration partenaire ; la saisie
              manuelle appartient au portail partenaire. Re-pointer le lien aurait
              menti sur l'intitule : le bouton doit disparaitre tant que la page
              n'existe pas. */}
        </div>
      </div>

      {/* Recherche + filtres statut */}
      <div className="flex flex-col gap-3">
        <Input
          startContent={<Search className="text-gray-400 w-4 h-4" />}
          variant="bordered"
          placeholder="Rechercher par code ou partenaire..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="max-w-md"
          size="sm"
          isClearable
          onClear={() => setSearchTerm('')}
        />
        <div className="flex gap-2 flex-wrap">
          {FILTRES.map((f) => (
            <Button
              key={f.id}
              size="sm"
              className="rounded-md font-medium"
              variant={statusFilter === f.id ? 'solid' : 'flat'}
              color={statusFilter === f.id ? 'primary' : 'default'}
              onPress={() => setStatusFilter(f.id)}
            >
              {f.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Cartes — l'echec prend la place des cartes, jamais une ligne au-dessus :
          sinon l'ecran afficherait en meme temps « aucune course trouvée ». */}
      {isError ? (
        <EtatErreur
          quoi="les courses"
          onReessayer={() => fetchData(currentPage)}
          enCours={isLoading}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-44" />
          ))}
        </div>
      ) : courses.length ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} delivers={delivers} canUpdate={canUpdate} />
          ))}
        </div>
      ) : (
        <EmptyDataTable
          title="Aucune course trouvée"
          message="Aucune course ne correspond aux filtres sur cette page. Changez de page ou réinitialisez les filtres."
        />
      )}

      {/* Pagination (serveur) */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center mt-2 w-full">
          <Pagination
            total={data?.totalPages ?? 1}
            page={currentPage}
            onChange={fetchData}
            showControls
            color="primary"
            variant="bordered"
            isDisabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
