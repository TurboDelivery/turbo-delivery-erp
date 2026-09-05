import { Button } from '@heroui-v3/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const RetourButton = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Garantir que le code s'exécute après le montage côté client
  }, []);

  const handleRetour = () => {
    window.history.back(); 
  };

  if (!isClient) {
    return null;
  }

  return (
    /*
     * `onClick` sur un Button v3 est ignore EN SILENCE : c'est `onPress`. Et le retour
     * en arriere n'est pas un geste dangereux — le `text-red-500` disait le contraire.
     */
    <Button aria-label="Revenir à la page précédente" isIconOnly onPress={handleRetour} variant="ghost">
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Button>
  );
};

export default RetourButton;
