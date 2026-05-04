import { useQueryClient } from '@tanstack/react-query';

export const entreeCaisseKeys = {
  all: ['entrees-caisse'] as const,
  lists: () => [...entreeCaisseKeys.all, 'list'] as const,
  list: (params?: unknown) => [...entreeCaisseKeys.lists(), params] as const,
  paginated: (params?: unknown) => [...entreeCaisseKeys.all, 'paginated', params] as const,
  details: () => [...entreeCaisseKeys.all, 'detail'] as const,
  detail: (id: string) => [...entreeCaisseKeys.details(), id] as const,
};

export const useInvalidateEntreeCaisseQuery = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: entreeCaisseKeys.all });
  };
};
