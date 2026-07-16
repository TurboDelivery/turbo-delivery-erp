import { createUrlFile } from '@/utils/createUrlFile';
import { DocumentsGallery, type DocItem } from './documents-gallery';
import { toAbsoluteUrl } from './to-absolute-url';

interface SectionDocumentsActuelsProps {
  avatarUrl?: string | null;
  cniUrlR?: string | null;
  cniUrlV?: string | null;
  vehiclePhotoUrl?: string | null;
  contratUrl?: string | null;
  ficheIdentificationUrl?: string | null;
  avenants?: string[] | null;
}

/** Photo de profil = servie par /api/serve/file ; les pièces = par /api/upload. */
function doc(key: string, label: string, url: string | null | undefined, avatar = false): DocItem | null {
  if (!url) return null;
  const abs = avatar ? createUrlFile(url, 'backend') : (toAbsoluteUrl(url) ?? url);
  return { key, label, url: abs };
}

export function SectionDocumentsActuels({
  avatarUrl,
  cniUrlR,
  cniUrlV,
  vehiclePhotoUrl,
  contratUrl,
  ficheIdentificationUrl,
  avenants,
}: SectionDocumentsActuelsProps) {
  const docs: DocItem[] = [
    doc('avatar', 'Photo de profil', avatarUrl, true),
    doc('cni-r', 'CNI recto', cniUrlR),
    doc('cni-v', 'CNI verso', cniUrlV),
    doc('fiche', "Fiche d'identification", ficheIdentificationUrl),
    doc('contrat', 'Contrat', contratUrl),
    doc('vehicule', 'Photo véhicule', vehiclePhotoUrl),
    ...(avenants ?? []).map((url, i) => doc(`avenant-${i}`, `Avenant ${i + 1}`, url)),
  ].filter((d): d is DocItem => d !== null);

  if (docs.length === 0) return null;

  return <DocumentsGallery docs={docs} />;
}
