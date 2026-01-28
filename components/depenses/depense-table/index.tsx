'use client';

import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { DataTable } from '@/components/block/data-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { IDepense } from '@/feature-finance/depenses/types/depense.type';
import { CreerDepenseModal } from '@/feature-finance/depenses/components/depense-list/creer-depense';
import Select from 'react-select';
import React from 'react';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

export function DepenseTable() {
  const { isLoading, isError, isFetching, pagination, filters, setSelectedCategories, depenses } = useDepenseTable();
  const { categories, isLoading: isLoadingCategory } = useCategorieDepense();
  const categorieOptions = categories.map((cat) => ({ value: cat.id, label: cat.nomCategorie }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between py-2">
        <Select
          isMulti
          options={categorieOptions}
          value={categorieOptions.filter((opt) => filters.categoriesDepense?.includes(opt.value))}
          isClearable
          onChange={(opt) => {
            const selectedIds = opt ? opt.map((o) => o.value) : [];
            setSelectedCategories(selectedIds);
          }}
          placeholder="Choisir une catégorie..."
          className="text-xs w-full max-w-lg"
          classNamePrefix="react-select"
          isLoading={isLoadingCategory}
        />
        <CreerDepenseModal />
      </div>
      <DataTable<IDepense> columns={depenseColumns} data={depenses} isLoading={isLoading} isError={isError} isFetching={isFetching} pagination={pagination} />
    </div>
  );
}
