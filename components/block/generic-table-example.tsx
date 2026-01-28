/**
 * ==========================================
 * EXEMPLE AVEC LE HOOK GÉNÉRIQUE
 * ==========================================
 *
 * Similaire à DepenseTable mais réutilisable
 */

'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import { useGenericTable, type GenericTableFilters, type GenericTableResponse } from '@/hooks/use-generic-table';
import { format } from 'date-fns';

// ========================================
// 1. DÉFINIR LE TYPE
// ========================================
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: string;
}

// ========================================
// 2. DÉFINIR LES FILTRES PERSONNALISÉS
// ========================================
interface ProductFilters extends GenericTableFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ========================================
// 3. DÉFINIR LES COLONNES
// ========================================
const productColumns: ColumnDef<Product>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => row.original.name,
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: 'Catégorie',
    cell: ({ row }) => row.original.category,
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => {
      const price = row.original.price;
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
    },
  },
  {
    id: 'stock',
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => (
      <span className={row.original.stock < 10 ? 'text-red-600 font-bold' : ''}>
        {row.original.stock}
      </span>
    ),
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Date création',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy'),
  },
];

// ========================================
// 4. HOOK PERSONNALISÉ (COMME use-depense-table)
// ========================================
const useProductTable = () => {
  const initialFilters: ProductFilters = {
    page: 0,
    limit: 50,
    orderBy: 'name',
    orderDirection: 'asc',
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  };

  // Simuler une requête React Query (remplacer par useProductListQuery)
  const mockQueryResult = {
    data: {
      content: [
        {
          id: '1',
          name: 'Laptop Dell',
          category: 'Informatique',
          price: 850000,
          stock: 5,
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Souris Logitech',
          category: 'Accessoires',
          price: 15000,
          stock: 50,
          createdAt: '2024-01-16',
        },
      ],
      totalPages: 1,
      totalElements: 2,
    } as GenericTableResponse<Product>,
    isLoading: false,
    isError: false,
    isFetching: false,
  };

  const result = useGenericTable<Product, ProductFilters>({
    columns: productColumns,
    initialFilters,
    queryResult: mockQueryResult,
  });

  return result;
};

// ========================================
// 5. COMPOSANT DE LA TABLE
// ========================================
export function ProductTable() {
  const { table, filters, setFilters, pagination, sorting, isLoading, isError, isFetching } = useProductTable();

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Filtrer par catégorie"
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, page: 0 }))}
          className="px-3 py-2 border rounded"
        />
      </div>

      <DataTable<Product>
        columns={productColumns}
        data={table.getRowModel().rows.map((row) => row.original)}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        pagination={pagination}
        sorting={sorting}
        onSortingChange={(newSorting) => {
          const first = newSorting[0];
          setFilters((prev) => ({
            ...prev,
            orderBy: first?.id,
            orderDirection: first?.desc ? 'desc' : 'asc',
            page: 0,
          }));
        }}
      />
    </div>
  );
}

/**
 * ==========================================
 * AVEC UNE VRAIE QUERY REACT QUERY
 * ==========================================
 *
 * const useProductTable = () => {
 *   const [filters, setFilters] = React.useState<ProductFilters>({
 *     page: 0,
 *     limit: 50,
 *     orderBy: 'name',
 *     orderDirection: 'asc',
 *   });
 *
 *   const { data, isLoading, isError, isFetching } = useProductListQuery({
 *     page: filters.page,
 *     limit: filters.limit,
 *     orderBy: filters.orderBy,
 *     orderDirection: filters.orderDirection,
 *     category: filters.category,
 *   });
 *
 *   return useGenericTable<Product, ProductFilters>({
 *     columns: productColumns,
 *     initialFilters: filters,
 *     queryResult: { data, isLoading, isError, isFetching },
 *   });
 * };
 */

export default ProductTable;
