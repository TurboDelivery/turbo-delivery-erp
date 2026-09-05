'use client';

import { Button, Popover } from '@heroui-v3/react';
import { Repeat } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
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
        onError: () => toast.error('La bascule a échoué.'),
        onSuccess: () => {
          toast.success(`Agent basculé en ${libelleCible}.`);
          setOuvert(false);
        },
      },
    );
  };

  return (
    /*
     * `Popover.Trigger` rend son PROPRE bouton : le `Button` est enfant direct du
     * `Popover`, faute de quoi on obtient un bouton dans un bouton et une erreur
     * d'hydratation a chaque rendu.
     */
    <Popover isOpen={ouvert} onOpenChange={setOuvert}>
      <Button size="sm" variant="outline">
        <Repeat aria-hidden="true" className="size-4" />
        Basculer en {libelleCible}
      </Button>
      <Popover.Content className="max-w-xs" placement="bottom end">
        <p className="text-sm text-muted">
          Basculer cet agent en <span className="font-semibold text-foreground">{libelleCible}</span> ?
          L&apos;événement est enregistré automatiquement au parcours.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button onPress={() => setOuvert(false)} size="sm" variant="ghost">
            Annuler
          </Button>
          <Button isPending={bascule.isPending} onPress={confirmer} size="sm" variant="primary">
            Confirmer
          </Button>
        </div>
      </Popover.Content>
    </Popover>
  );
}
