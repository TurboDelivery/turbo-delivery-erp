'use client';

import React from 'react';
import Select from 'react-select';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

interface CategoriesSelectFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[] | null) => void;
}

export function CategoriesSelectFilter({ selectedCategories, onCategoriesChange }: CategoriesSelectFilterProps) {
  const { categories, isLoading: isLoadingCategory } = useCategorieDepense();
  const categorieOptions = categories.map((cat) => ({ value: cat.id.toString(), label: cat.nomCategorie }));

  return (
    <Select
      isMulti
      options={categorieOptions}
      value={categorieOptions.filter((opt) => selectedCategories?.includes(opt.value))}
      isClearable
      onChange={(opt) => {
        const selectedIds = opt && opt.length > 0 ? opt.map((o) => o.value) : null;
        onCategoriesChange(selectedIds);
      }}
      placeholder="Choisir une catégorie..."
      className="text-xs w-full max-w-sm"
      classNamePrefix="react-select"
      isLoading={isLoadingCategory}
    />
  );
}


