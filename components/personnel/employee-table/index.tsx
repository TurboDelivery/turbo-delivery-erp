'use client';

import { Button, Card, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';
import { DollarSign, Download, Plus, TrendingUp, Users } from 'lucide-react';

import { Can } from '@/components/auth/Can';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import {
  ChipStatutEmploye,
  EmployeeActions,
  employeeColumns,
} from '@/components/personnel/employee-table/employee-columns';
import {
  PersonnelMobileCard,
  PersonnelMobileCardList,
} from '@/components/personnel/shared/personnel-mobile-card';
import { ExportFormat } from '@/features/personnel/apis/employee.api';
import { DEPARTMENTS } from '@/features/personnel/constants/employee.constants';
import { useEmployeeTableNew } from '@/features/personnel/hooks/use-employee-table-new';
import { useExporterEmployesMutation } from '@/features/personnel/mutations/employee.mutation';
import { useEmployeeSalaryStatsQuery } from '@/features/personnel/queries';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { EmployeeSearchInput } from './employee-search-input';
import { PostesSelectFilter, StatutsSelectFilter } from './filtres-employe';

interface EmployeeTableProps {
  onEditPosition: (employee: any) => void;
  onDeactivate: (employee: any) => void;
  onRemove: (employee: any) => void;
  onAddEmployee: () => void;
}

export default function EmployeeTableNew({ onEditPosition, onDeactivate, onRemove, onAddEmployee }: EmployeeTableProps) {
  const { mutate: exporterEmployes, isPending: isExporting } = useExporterEmployesMutation();

  const { table, isLoading, isError, isFetching, refetch, pagination, filters, setSelectedDepartments, setSelectedStatuts, setSelectedPostes, handleSearchChange } = useEmployeeTableNew({
    onEdit: onEditPosition,
    onDeactivate: onDeactivate,
    onRemove: onRemove,
    page: 0,
    limit: 50,
    search: '',
  });

  const statsParams = {
    search: filters.search || undefined,
    position: filters.postes?.length ? filters.postes[0] : undefined,
    department: filters.departments?.length ? filters.departments[0] : undefined,
    statut: filters.statuts?.length ? filters.statuts[0] : undefined,
  };

  const exportParams = {
    search: filters.search || undefined,
    position: filters.postes?.length ? filters.postes[0] : undefined,
    department: filters.departments?.length ? filters.departments[0] : undefined,
    statut: filters.statuts?.length ? filters.statuts[0] : undefined,
  };

  const handleExport = (format: ExportFormat) => {
    exporterEmployes({ ...exportParams, format });
  };

  // L'echec ne prend la place des lignes que s'il n'y a rien a montrer : un rafraichissement
  // rate laisse la liste deja chargee en place plutot que de la faire disparaitre.
  const enEchec = isError && table.getRowModel().rows.length === 0;
  const { data: salaryStatsData } = useEmployeeSalaryStatsQuery(statsParams);

  /*
   * LA BARRE DE FILTRES ETAIT ECRITE DEUX FOIS.
   *
   * <p>Une copie dans le `topContent` du tableau, une autre dans le bloc mobile — memes
   * champs, memes gestes, deux endroits a corriger le jour ou l'un des deux bouge. Elle
   * est montee une fois, au-dessus des deux.</p>
   */
  const barreFiltres = (
    <div className="flex flex-col items-stretch gap-2 py-2 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <EmployeeSearchInput onChange={handleSearchChange} value={filters.search || ''} />
        <StatutsSelectFilter
          onStatutsChange={setSelectedStatuts}
          selectedStatuts={filters.statuts || []}
        />
        <PostesSelectFilter onPostesChange={setSelectedPostes} selectedPostes={filters.postes || []} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button isPending={isExporting} onPress={() => handleExport('EXCEL')} variant="outline">
          <Download aria-hidden="true" className="size-4" />
          Exporter
        </Button>
        <Can I="create" a="Personnel">
          <Button onPress={onAddEmployee} variant="primary">
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un employé
          </Button>
        </Can>
      </div>
    </div>
  );

  const enTetes = table.getFlatHeaders();
  const departementActif = filters.departments?.[0] ?? 'all';

  const zonePagination =
    (pagination?.pageCount ?? 0) > 1 ? (
      <PaginationTableau
        onPage={(p) => pagination.handlePageChange(p)}
        page={filters.page + 1}
        total={pagination?.pageCount ?? 1}
      />
    ) : null;

  return (
    <div className="space-y-4">
      {/*
       * Le bandeau etait un degrade `from-blue-50 to-indigo-50` borde de `blue-200`,
       * avec trois pastilles bleue, verte et violette : six teintes de palette sans
       * variante sombre, pour trois chiffres. Le projet a une carte de statistique.
       */}
      <GrilleStats colonnes={3}>
        <CarteStat
          icone={Users}
          libelle="Total employés"
          valeur={String(salaryStatsData?.totalEmployees ?? 0)}
        />
        <CarteStat
          icone={DollarSign}
          libelle="Masse salariale"
          ton="succes"
          valeur={formatCFA(salaryStatsData?.totalSalary ?? 0)}
        />
        <CarteStat
          icone={TrendingUp}
          libelle="Employés actifs"
          valeur={String(salaryStatsData?.totalActiveEmployees ?? 0)}
        />
      </GrilleStats>

      {/*
       * Les departements defilaient horizontalement dans un `ScrollArea` de shadcn.
       * Ils passent au groupe de bascule de la bibliotheque, qui enroule : dix
       * departements tiennent sur deux lignes plutot que de se cacher hors de l'ecran.
       */}
      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(sel) => {
          const val = String(Array.from(sel)[0] ?? 'all');
          setSelectedDepartments(val === 'all' ? null : [val]);
        }}
        selectedKeys={new Set([departementActif])}
        selectionMode="single"
        size="sm"
      >
        <ToggleButton id="all">Tous</ToggleButton>
        {DEPARTMENTS.map((dept) => (
          <ToggleButton id={dept.name} key={dept.name}>
            {dept.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {barreFiltres}

      {/* Tableau des employés — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Employés" className="min-w-[64rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader={header.id === 'name'}
                      key={header.id}
                    >
                      {({ sortDirection }) =>
                        header.column.getCanSort() ? (
                          <Table.SortableColumnHeader sortDirection={sortDirection}>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.SortableColumnHeader>
                        ) : (
                          <>
                            {header.isPlaceholder
                              ? ''
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </>
                        )
                      }
                    </Table.Column>
                  ))}
                </Table.Header>

                {/* L'echec prend la place des lignes : un tableau vide se lirait « aucun employe ». */}
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : enEchec ? (
                      <div className="py-6">
                        <EtatErreur
                          enCours={isFetching}
                          onReessayer={() => refetch()}
                          quoi="les employés"
                        />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucun employé trouvé</p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES en-tetes que les lignes. */}
                  {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {enTetes.map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading || enEchec ? [] : table.getRowModel().rows).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell className={isFetching ? 'opacity-70' : undefined} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {zonePagination && (
              <Table.Footer className="justify-center">{zonePagination}</Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <PersonnelMobileCardList>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
          ))
        ) : enEchec ? (
          <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les employés" />
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun employé trouvé</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const employee = row.original;
            return (
              <PersonnelMobileCard
                actions={
                  <EmployeeActions
                    employee={employee}
                    onDeactivate={onDeactivate}
                    onEdit={onEditPosition}
                    onRemove={onRemove}
                  />
                }
                fields={[
                  { label: 'Poste', value: employee.position },
                  { label: 'Département', value: employee.department },
                  { label: 'Salaire', value: formatCFA(employee.salary || 0) },
                  {
                    label: "Date d'entrée",
                    value: employee.entryDate
                      ? format(new Date(employee.entryDate), 'dd/MM/yyyy')
                      : '-',
                  },
                ]}
                key={employee.id}
                statut={<ChipStatutEmploye statut={employee.statut} />}
                subtitle={employee.email}
                title={employee.name}
              />
            );
          })
        )}
        {zonePagination && <div className="flex justify-center pt-2">{zonePagination}</div>}
      </PersonnelMobileCardList>
    </div>
  );
}
