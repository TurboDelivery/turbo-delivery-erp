'use client';

import { employeeColumns, EmployeeActions, getEmployeeStatutConfig } from '@/components/personnel/employee-table/employee-columns';
import { PersonnelMobileCard, PersonnelMobileCardList } from '@/components/personnel/shared/personnel-mobile-card';
import EtatErreur from '@/components/commons/EtatErreur';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployeeTableNew } from '@/features/personnel/hooks/use-employee-table-new';
import { useEmployeeSalaryStatsQuery } from '@/features/personnel/queries';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { DEPARTMENTS } from '@/features/personnel/constants/employee.constants';
import { Button, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';
import { DollarSign, Download, Plus, TrendingUp, Users } from 'lucide-react';
import { PostesSelectFilter } from './postes-select-filter';
import { StatutsSelectFilter } from './statuts-select-filter';
import { EmployeeSearchInput } from './employee-search-input';
import { Can } from '@/components/auth/Can';
import { useExporterEmployesMutation } from '@/features/personnel/mutations/employee.mutation';
import { ExportFormat } from '@/features/personnel/apis/employee.api';

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

  return (
    <div className="space-y-2">
      {/* Carte de statistiques pour les employés */}
      <Card>
        <CardContent className="p-0  ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Employés</p>
                <p className="text-2xl font-bold text-blue-700">{salaryStatsData?.totalEmployees || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Masse Salariale</p>
                <p className="text-2xl font-bold text-green-700">{formatCFA(salaryStatsData?.totalSalary || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Employés Actifs</p>
                <p className="text-2xl font-bold text-purple-700">{salaryStatsData?.totalActiveEmployees || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de filtrage par département */}
      <div className="py-3">
        <Tabs value={filters.departments?.[0] ?? 'all'} onValueChange={(val) => setSelectedDepartments(val === 'all' ? null : [val])}>
          <ScrollArea className="w-full">
            <TabsList className="flex w-max">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Tous
              </TabsTrigger>
              {DEPARTMENTS.map((dept) => (
                <TabsTrigger key={dept.name} value={dept.name} className="text-xs sm:text-sm">
                  {dept.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Tabs>
      </div>

      {/* Tableau des employés — desktop uniquement (≥ md) */}
      <Card className="p-0 hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table
              isStriped
              topContent={
                <div className="flex flex-col md:flex-row justify-between items-center py-2 gap-2">
                  <div className="flex flex-col md:flex-row gap-2 flex-1">
                    <EmployeeSearchInput value={filters.search || ''} onChange={handleSearchChange} />
                    <StatutsSelectFilter selectedStatuts={filters.statuts || []} onStatutsChange={setSelectedStatuts} />
                    <PostesSelectFilter selectedPostes={filters.postes || []} onPostesChange={setSelectedPostes} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="bordered" onPress={() => handleExport('EXCEL')} startContent={<Download size={16} />} isLoading={isExporting}>
                      Exporter
                    </Button>
                    <Can I="create" a="Personnel">
                      <Button color="primary" startContent={<Plus size={16} />} onPress={onAddEmployee}>
                        Ajouter un employé
                      </Button>
                    </Can>
                  </div>
                </div>
              }
              bottomContent={
                pagination?.pageCount! > 1 && (
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
                  </div>
                )
              }
            >
              <TableHeader>
                {table.getFlatHeaders().map((header) => (
                  <TableColumn className="text-primary" key={header.id} allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableColumn>
                ))}
              </TableHeader>
              {/* L'echec prend la place des lignes : un tableau vide se lirait « aucun employe ». */}
              <TableBody emptyContent={enEchec ? <EtatErreur quoi="les employés" onReessayer={() => refetch()} enCours={isFetching} /> : undefined}>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {employeeColumns.map((col) => (
                          <TableCell key={`skeleton-cell-${col.header || col.id}`} className="h-12">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : enEchec
                    ? []
                    : table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {/* Filtres + actions (mêmes composants que le topContent du tableau) */}
        <div className="flex flex-col gap-2">
          <EmployeeSearchInput value={filters.search || ''} onChange={handleSearchChange} />
          <div className="flex flex-wrap gap-2">
            <StatutsSelectFilter selectedStatuts={filters.statuts || []} onStatutsChange={setSelectedStatuts} />
            <PostesSelectFilter selectedPostes={filters.postes || []} onPostesChange={setSelectedPostes} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="bordered" className="w-full sm:w-auto" onPress={() => handleExport('EXCEL')} startContent={<Download size={16} />} isLoading={isExporting}>
              Exporter
            </Button>
            <Can I="create" a="Personnel">
              <Button color="primary" className="w-full sm:w-auto" startContent={<Plus size={16} />} onPress={onAddEmployee}>
                Ajouter un employé
              </Button>
            </Can>
          </div>
        </div>

        <PersonnelMobileCardList>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={`m-skel-${i}`} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)
          ) : enEchec ? (
            <EtatErreur quoi="les employés" onReessayer={() => refetch()} enCours={isFetching} />
          ) : table.getRowModel().rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun employé trouvé</p>
          ) : (
            table.getRowModel().rows.map((row) => {
              const employee = row.original;
              const statut = getEmployeeStatutConfig(employee.statut);
              return (
                <PersonnelMobileCard
                  key={employee.id}
                  title={employee.name}
                  subtitle={employee.email}
                  statut={statut.label}
                  statutClassName={statut.className}
                  fields={[
                    { label: 'Poste', value: employee.position },
                    { label: 'Département', value: employee.department },
                    { label: 'Salaire', value: formatCFA(employee.salary || 0) },
                    { label: "Date d'entrée", value: employee.entryDate ? format(new Date(employee.entryDate), 'dd/MM/yyyy') : '-' },
                  ]}
                  actions={<EmployeeActions employee={employee} onEdit={onEditPosition} onDeactivate={onDeactivate} onRemove={onRemove} />}
                />
              );
            })
          )}
        </PersonnelMobileCardList>

        {pagination?.pageCount! > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
          </div>
        )}
      </div>
    </div>
  );
}
