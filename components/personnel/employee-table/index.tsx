'use client';

import { employeeColumns } from '@/components/personnel/employee-table/employee-columns';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployeeTableNew } from '@/features/personnel/hooks/use-employee-table-new';
import { useEmployeeStatsQuery, useEmployeeSalaryStatsQuery } from '@/features/personnel/queries';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { Button, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { DollarSign, Plus, TrendingUp, Users } from 'lucide-react';
import { DepartmentsSelectFilter } from './departments-select-filter';
import { PostesSelectFilter } from './postes-select-filter';
import { StatutsSelectFilter } from './statuts-select-filter';
import { EmployeeSearchInput } from './employee-search-input';

interface EmployeeTableProps {
  onEditPosition: (employee: any) => void;
  onDeactivate: (employee: any) => void;
  onRemove: (employee: any) => void;
  onAddEmployee: () => void;
}


export function EmployeeTableNew({ onEditPosition, onDeactivate, onRemove, onAddEmployee }: EmployeeTableProps) {
  // Données de départements et positions
  const departments = [
    { id: '1', name: 'RESSOURCES HUMAINES' },
    { id: '2', name: 'COMMUNICATION - MARKETING' },
    { id: '3', name: 'DEVELOPPEMENT' },
    { id: '4', name: 'COMMERCIAL' },
    { id: '5', name: 'OPERATIONS' },
    { id: '6', name: 'DIRECTION' },
    { id: '7', name: 'TECHNIQUE' },
    { id: '8', name: 'LOGISTIQUE' },
    { id: '9', name: 'INFORMATIQUE' }
  ];

  const postes = [
    'DIRECTEUR GENERAL',
    'DIRECTEUR GENERAL ADJOINT',
    'RESPONSABLE DES OPERATIONS',
    'RESPONSABLE COMPTABLE',
    'RESPONSABLE DES RECOUVREMENTS',
    'CHEF AUX OPERATIONS',
    'STANDARDISTE',
    'AGENT DE LA CENTRALE D\'APPEL',
    'SUPERVISEURS',
    'DISPATCHERS',
    'DISPACTHEUSES',
    'SERVICE AUTHENTIFICATION ET VERIFICATION DE COUPONS',
    'DEVELOPPEUR',
    'CM - MARKETING',
    'SECRETAIRE DE DIRECTION',
    'Turboy Journalier'
  ];

  const { table, isLoading, isFetching, pagination, filters, setSelectedDepartments, setSelectedStatuts, setSelectedPostes, handleSearchChange } = useEmployeeTableNew({
    onEdit: onEditPosition,
    onDeactivate: onDeactivate,
    onRemove: onRemove,
    page: 0,
    limit: 50,
    search: '',
  });
const { data: salaryStatsData, isLoading: salaryStatsLoading } = useEmployeeSalaryStatsQuery();
  // Utiliser les filtres du tableau pour les stats
  const currentSearchParams = {
    debut: filters.debut,
    fin: filters.fin,
    departments: filters.departments || undefined,
    statuts: filters.statuts || undefined,
    postes: filters.postes || undefined,
    search: filters.search || undefined, // Ajouter la recherche aux stats
  };

  // Utiliser les mêmes filtres pour les stats
  const { data: statsData, isLoading: statsLoading } = useEmployeeStatsQuery(currentSearchParams);
  

  return (
    <div className="space-y-6">
      {/* Carte de statistiques pour les employés */}
      <Card className="flex flex-col gap-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
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

      {/* Tableau des employés */}
      <Card className="flex flex-col gap-4">
        <CardContent>
          <div className="overflow-x-auto">
            <Table
              isStriped
              topContent={
                <div className="flex justify-between items-center py-2">
                  <div className="flex gap-2">
                    <EmployeeSearchInput 
                      value={filters.search || ''} 
                      onChange={handleSearchChange}
                    />
                    <DepartmentsSelectFilter selectedDepartments={filters.departments || []} onDepartmentsChange={setSelectedDepartments} departments={departments} />
                    <StatutsSelectFilter selectedStatuts={filters.statuts || []} onStatutsChange={setSelectedStatuts} />
                    <PostesSelectFilter selectedPostes={filters.postes || []} onPostesChange={setSelectedPostes} postes={postes} />
                  </div>
                  <Button 
                    color="primary" 
                    startContent={<Plus size={16} />}
                    onPress={onAddEmployee}
                  >
                    Ajouter un employé
                  </Button>
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
              <TableBody>
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
    </div>
  );
}
