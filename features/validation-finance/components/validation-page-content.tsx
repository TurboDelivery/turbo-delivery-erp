'use client';

import { ShieldX } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { sessionRoleToRole } from './validation.constants';
import { ValidationPageAuthorized } from './validation-page-authorized';

export default function ValidationPageContent() {
  const { data: session } = useSession();
  const userRole = sessionRoleToRole(session?.user?.role);

  if (!userRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-500">
        <ShieldX className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium">Accès non autorisé</p>
        <p className="mt-1 text-sm">Votre rôle ne permet pas d&apos;accéder aux validations de charges.</p>
      </div>
    );
  }

  return <ValidationPageAuthorized userRole={userRole} />;
}
