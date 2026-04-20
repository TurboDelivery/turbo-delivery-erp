import { SectionTitle } from './section-title';
import { DocPreview } from './doc-preview';

interface SectionDocumentsActuelsProps {
  avatarUrl?: string | null;
  cniUrlR?: string | null;
  cniUrlV?: string | null;
  vehiclePhotoUrl?: string | null;
  contratUrl?: string | null;
}

export function SectionDocumentsActuels({
  avatarUrl,
  cniUrlR,
  cniUrlV,
  vehiclePhotoUrl,
  contratUrl,
}: SectionDocumentsActuelsProps) {
  if (!avatarUrl && !cniUrlR && !cniUrlV && !vehiclePhotoUrl && !contratUrl) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <SectionTitle>Documents actuels</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {avatarUrl && <DocPreview label="Photo de profil" url={avatarUrl} />}
        {cniUrlR && <DocPreview label="CNI recto" url={cniUrlR} />}
        {cniUrlV && <DocPreview label="CNI verso" url={cniUrlV} />}
        {vehiclePhotoUrl && <DocPreview label="Photo véhicule" url={vehiclePhotoUrl} />}
        {contratUrl && <DocPreview label="Contrat" url={contratUrl} />}
      </div>
    </section>
  );
}
