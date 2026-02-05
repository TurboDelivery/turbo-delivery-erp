import React from 'react';
import Select from 'react-select';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

function CategoriesFilter({ value, setSelectedCategory }: { value: any; setSelectedCategory: (id: string | null) => void }) {
  const { categories, isLoading: isLoadingCategory } = useCategorieDepense();
  const categorieOptions = categories.map((cat) => ({ value: cat.id, label: cat.nomCategorie }));
  return (
    <Select
      options={categorieOptions}
      value={categorieOptions.filter((opt) => value)}
      isClearable
      onChange={(opt) => {
        const selectedId = opt ? opt.value : null;
        setSelectedCategory(selectedId);
      }}
      placeholder="Choisir une catégorie..."
      className="text-xs w-full max-w-lg"
      classNamePrefix="react-select"
      isLoading={isLoadingCategory}
    />
  );
}

export default CategoriesFilter;
