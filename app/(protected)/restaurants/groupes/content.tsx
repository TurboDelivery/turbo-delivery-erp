'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryState } from 'nuqs';

import { useAbility } from '@/hooks/use-ability';
import { ConstituerGroupeModal } from '@/features/groupes-partenaires/components/constituer-groupe-modal';
import { GroupeDetailPanel } from '@/features/groupes-partenaires/components/groupe-detail-panel';
import { GroupesListePanel } from '@/features/groupes-partenaires/components/groupes-liste-panel';
import {
  groupesPartenairesKeys,
  useGroupesListeQuery,
} from '@/features/groupes-partenaires/queries/groupes-partenaires.query';

/**
 * Groupes de partenaires — administration côté ERP.
 *
 * Répond à la demande owner du 04/08/2026 : réunir plusieurs restaurants sous un même
 * groupe, désigner le compte principal, et faire des autres comptes des invités sur le
 * périmètre de leurs propres établissements — « comme ça on ne perd rien ».
 *
 * <b>Le parti pris de l'écran.</b> « On ne perd rien » n'est pas une promesse à tenir
 * en silence : chacune des trois opérations (constituer, changer le compte principal,
 * détacher) affiche AVANT validation ce qu'elle change pour chaque compte — son rôle,
 * sa portée, ses établissements avant et après. Le bouton de validation n'existe que
 * derrière ce récapitulatif.
 *
 * Le groupe ouvert est porté par l'URL (`?groupe=`) : un lien vers une fiche se partage
 * et le retour navigateur ramène à la liste, sans état caché dans le composant.
 */
export default function GroupesPartenairesContent() {
  const ability = useAbility();
  const { data: sessionAuth } = useSession();
  const userId = sessionAuth?.user?.id ?? '';
  const queryClient = useQueryClient();

  const [groupeOuvert, setGroupeOuvert] = useQueryState('groupe');
  const [constituer, setConstituer] = useState(false);

  const { data: groupes, isLoading } = useGroupesListeQuery(userId);

  const peutLire = ability.can('read', 'GroupePartenaire');
  const peutAdministrer = ability.can('manage', 'GroupePartenaire');

  if (!peutLire) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès à l&apos;administration des groupes de partenaires.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Groupes de partenaires</h1>
          <p className="mt-1 max-w-3xl text-sm text-default-500">
            Réunir plusieurs établissements sous un même groupe et désigner le compte qui les administre. Les
            comptes des établissements groupés conservent l&apos;accès qu&apos;ils ont aujourd&apos;hui : chaque
            opération montre, compte par compte, ce qu&apos;elle change avant d&apos;être validée.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={() => queryClient.invalidateQueries({ queryKey: groupesPartenairesKeys.all })}
          >
            Actualiser
          </Button>
          {peutAdministrer && !groupeOuvert && (
            <Button
              size="sm"
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => setConstituer(true)}
            >
              Constituer un groupe
            </Button>
          )}
        </div>
      </div>

      {groupeOuvert ? (
        <GroupeDetailPanel
          groupeId={groupeOuvert}
          userId={userId}
          peutAdministrer={peutAdministrer}
          onRetour={() => void setGroupeOuvert(null)}
        />
      ) : (
        <GroupesListePanel
          groupes={groupes ?? []}
          isLoading={isLoading}
          onOuvrir={(groupeId) => void setGroupeOuvert(groupeId)}
        />
      )}

      <ConstituerGroupeModal
        isOpen={constituer}
        onClose={() => setConstituer(false)}
        userId={userId}
        onCree={(groupeId) => void setGroupeOuvert(groupeId)}
      />
    </div>
  );
}
