'use client';

import { useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import { useSession } from 'next-auth/react';
import { Repeat } from 'lucide-react';
import { toast } from 'sonner';

import { TypeLivreurBascule } from '@/features/personnel/apis/personnel-historisation.api';
import { useBasculerTypeLivreurMutation } from '@/features/personnel/queries/personnel-historisation.query';
import { libelleTypeCollaborateur } from '@/features/personnel/utils/personnel-historisation.utils';

interface Props {
  employeId: string;
  livreurId: string;
  typeActuel: TypeLivreurBascule;
}

/**
 * Bascule journalier ⇄ indépendant.
 *
 * Le geste reste celui d'aujourd'hui : un clic, une confirmation légère, un appel. Aucune
 * saisie de motif, aucune étape ajoutée — l'événement de parcours est écrit par le serveur,
 * qui sait qui a basculé quoi et quand. C'est exactement l'esprit de la spec : historiser
 * sans alourdir le geste.
 */
export function BasculeTypeBouton({ employeId, livreurId, typeActuel }: Props) {
  const { data: session } = useSession();
  const [ouvert, setOuvert] = useState(false);
  const bascule = useBasculerTypeLivreurMutation(employeId);

  const cible: TypeLivreurBascule = typeActuel === 'JOURNALIER' ? 'INDEPENDANT' : 'JOURNALIER';
  const libelleCible = libelleTypeCollaborateur(cible);

  const confirmer = () => {
    bascule.mutate(
      { livreurId, typeLivreur: cible, userId: session?.user?.id ? String(session.user.id) : null },
      {
        onSuccess: () => {
          toast.success(`Agent basculé en ${libelleCible}.`);
          setOuvert(false);
        },
        onError: () => toast.error('La bascule a échoué.'),
      },
    );
  };

  return (
    <Popover isOpen={ouvert} onOpenChange={setOuvert} placement="bottom-end">
      <PopoverTrigger>
        <Button size="sm" variant="bordered" startContent={<Repeat className="h-4 w-4" />}>
          Basculer en {libelleCible}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs p-3">
        <p className="text-sm text-default-600">
          Basculer cet agent en <span className="font-semibold">{libelleCible}</span> ? L&apos;événement est
          enregistré automatiquement au parcours.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="light" onPress={() => setOuvert(false)}>
            Annuler
          </Button>
          <Button size="sm" color="primary" isLoading={bascule.isPending} onPress={confirmer}>
            Confirmer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
