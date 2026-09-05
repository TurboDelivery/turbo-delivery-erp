'use client';

import Link from 'next/link';
import { User } from '@/types/models';
import { Button } from '@heroui-v3/react';

import { LienBouton } from '@/components/commons/LienBouton';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { useAbility } from '@/hooks/use-ability';
import { canAccessRoute } from '@/utils/route-permission';

interface ProtectedPageProps {
    profile: User;
    children: React.ReactNode;
}

const ProtectedPage = ({ profile: _profile, children }: ProtectedPageProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const ability = useAbility();
    const hasAccess = useMemo(() => canAccessRoute(ability, pathname), [ability, pathname]);

    if (!hasAccess) {
        return (
          <div className="h-screen w-full flex items-center justify-center bg-linear-to-b from-background to-muted">
            <div className="text-center space-y-8 px-4">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-4">
                <h1 className="text-9xl font-bold tracking-tighter bg-linear-to-r from-primary to-yellow-600 text-transparent bg-clip-text">403</h1>
                <h2 className="text-4xl font-semibold text-foreground">Not Authorized</h2>
              </motion.div>

              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground max-w-sm mx-auto">
                Désolé, Vous n&#39;êtes pas autorisé à accéder à cette page
              </motion.p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
                <LienBouton href="/" variante="primary">
                  <Home aria-hidden="true" className="size-4" />
                  Accueil
                </LienBouton>
                <Button onPress={() => router.back()} variant="ghost">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Retour
                </Button>
              </motion.div>
            </div>
          </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedPage;
