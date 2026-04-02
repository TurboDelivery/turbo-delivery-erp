import { flexRender } from '@tanstack/react-table';
import { Pagination } from '@heroui/react';
import { IChargeFixe } from '../types/charge-fixe.type';
import { useChargesFixesTable } from '../hooks/use-charges-fixes-table';

interface ChargesFixesTableProps {
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
}

export default function ChargesFixesTable({ onEdit, onDelete }: ChargesFixesTableProps) {
  const {
    table,
    data,
    isLoading,
    isFetching,
    pageCount,
    pagination,
    setPagination,
  } = useChargesFixesTable({ onEdit, onDelete });

  const handlePageChange = (newPage: number) => {
    setPagination({
      ...pagination,
      pageIndex: newPage - 1,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 text-sm">Chargement des charges fixes...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500 text-sm">Aucune charge fixe configuree.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.original.automatique ? 'bg-green-50/60' : 'hover:bg-gray-50 transition-colors'
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="flex justify-center pt-4 sm:pt-6 pb-3 border-t border-gray-200">
          <Pagination
            total={pageCount}
            page={pagination.pageIndex + 1}
            onChange={handlePageChange}
            color="primary"
            isDisabled={isFetching}
          />
        </div>
      )}
    </div>
  );
}
