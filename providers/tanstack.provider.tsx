'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface ProvidersProps {
    children: React.ReactNode;
}

const queryClient = new QueryClient();
export default function TanStackProvider({ children }: ProvidersProps) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
