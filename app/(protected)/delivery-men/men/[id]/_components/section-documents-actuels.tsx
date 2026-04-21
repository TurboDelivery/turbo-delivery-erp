import { SectionTitle } from './section-title';
import { DocPreview } from './doc-preview';

interface SectionDocumentsActuelsProps {
  avatarUrl?: string | null;
  cniUrlR?: string | null;
  cniUrlV?: string | null;
  vehiclePhotoUrl?: string | null;
  contratUrl?: string | null;
  avenants?: string[] | null;
}

export function SectionDocumentsActuels({
  avatarUrl,
  cniUrlR,
  cniUrlV,
  vehiclePhotoUrl,
  contratUrl,
  avenants,
}: SectionDocumentsActuelsProps) {
  const hasAvenants = avenants && avenants.length > 0;
  if (!avatarUrl && !cniUrlR && !cniUrlV && !vehiclePhotoUrl && !contratUrl && !hasAvenants) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Documents actuels</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {avatarUrl && <DocPreview label="Photo de profil" url={avatarUrl} />}
        {cniUrlR && <DocPreview label="CNI recto" url={cniUrlR} />}
        {cniUrlV && <DocPreview label="CNI verso" url={cniUrlV} />}
        {vehiclePhotoUrl && <DocPreview label="Photo véhicule" url={vehiclePhotoUrl} />}
        {contratUrl && <DocPreview label="Contrat" url={contratUrl} />}
        {hasAvenants && avenants.map((url, i) => (
          <DocPreview key={`avenant-${i}`} label={`Avenant ${i + 1}`} url={url} />
        ))}
      </div>
    </section>
  );
}
