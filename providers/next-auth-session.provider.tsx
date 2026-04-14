'use client';

import { SessionProvider } from 'next-auth/react';
import { AbilityProvider } from '@/lib/casl/ability-context';

const NextAuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <AbilityProvider>{children}</AbilityProvider>
    </SessionProvider>
  );
};

export default NextAuthSessionProvider;
