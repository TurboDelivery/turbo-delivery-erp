import { Metadata } from 'next';

import GroupesPartenairesContent from './content';

export const metadata: Metadata = {
  title: 'Groupes de partenaires',
};

// Le groupe ouvert vit dans l'URL (`?groupe=`) : rien à pré-rendre à la construction.
export const dynamic = 'force-dynamic';

export default function GroupesPartenairesPage() {
  return <GroupesPartenairesContent />;
}
