import React, { useMemo } from 'react';
import Select from 'react-select';
import { useEmployeeListQuery } from '@/features/personnel/queries';

interface EmployeeSelectProps {
  value?: string;
  onChange: (value?: string) => void;
  options?: Array<{ label: string; value: string }>;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
  limit?: number;
}

export function EmployeeSelect({
  value,
  onChange,
  options,
  isLoading = false,
  isDisabled = false,
  placeholder = 'Selectionner un employe',
  className = 'text-xs w-full max-w-md',
  limit = 500,
}: EmployeeSelectProps) {
  const { data, isLoading: queryLoading } = useEmployeeListQuery({
    page: 0,
    limit,
  });

  const employeeOptions = useMemo(() => {
    const employees = data?.content ?? [];
    return [...employees]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((employee) => ({
        label: employee.name,
        value: employee.id,
      }));
  }, [data?.content]);

  const selectOptions = options && options.length > 0 ? options : employeeOptions;
  const loading = isLoading || queryLoading;

  return (
    <Select
      options={selectOptions}
      value={selectOptions.find((o) => o.value === value) ?? null}
      onChange={(opt) => onChange(opt?.value)}
      placeholder={placeholder}
      isClearable
      isLoading={loading}
      isDisabled={loading || isDisabled}
      className={className}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '36px',
          height: '36px',
          width: '100%',
        }),
        valueContainer: (base) => ({
          ...base,
          height: '36px',
          padding: '0 8px',
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: '36px',
        }),
      }}
    />
  );
}


