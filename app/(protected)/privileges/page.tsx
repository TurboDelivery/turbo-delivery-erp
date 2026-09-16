import { PrivilegesEcran } from '@/components/privileges/privileges-ecran';
import { getDerogations } from '@/src/privileges/privileges.action';

/**
 * L'ecran doit lire les derogations EN VIGUEUR a chaque ouverture : une valeur mise en
 * cache montrerait l'etat d'avant le dernier enregistrement, sur l'ecran meme qui sert a
 * le faire.
 */
export const dynamic = 'force-dynamic';

export default async function PrivilegesPage() {
  const derogations = await getDerogations();

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Privilèges par rôle</h1>
        <p className="max-w-3xl text-sm text-muted">
          Ce que chaque rôle voit dans le menu et peut ouvrir. Les réglages faits ici
          s&apos;appliquent à la connexion suivante de la personne concernée, sans
          redéploiement. Ce qui n&apos;est pas réglé à la main suit la matrice du code
          (<code className="rounded bg-surface-secondary px-1">lib/casl/ability.ts</code>).
        </p>
      </div>

      <PrivilegesEcran derogationsInitiales={derogations} />
    </div>
  );
}
