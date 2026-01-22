import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

const getQueryClient = cache(() => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute 
            gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
            retry: (failureCount) => {
                return failureCount < 3;
            },
            
        },
    },
}));

export default getQueryClient;