import { Check } from 'lucide-react';

import { PrivilegesMatrix } from '@/components/privileges/privileges-matrix';

export default function PrivilegesPage() {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Privilèges par rôle</h1>
        <p className="max-w-3xl text-sm text-default-500">
          Vue lecture seule : quel rôle peut accéder à quel menu / page. Les permissions
          sont définies dans le code (<code className="rounded bg-default-100 px-1">lib/casl/ability.ts</code>,
          matrice <code className="rounded bg-default-100 px-1">ROLE_RULES</code>). Pour les modifier,
          éditer la matrice et redéployer.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-default-500">
        <span className="flex items-center gap-1">
          <Check className="h-4 w-4 text-success-600" /> Autorisé
        </span>
        <span className="flex items-center gap-1">
          <span className="text-default-300">·</span> Non autorisé
        </span>
        <span className="flex items-center gap-1">
          <span className="text-default-200">—</span> Groupe (pas de contrôle propre)
        </span>
      </div>

      <PrivilegesMatrix />
    </div>
  );
}
