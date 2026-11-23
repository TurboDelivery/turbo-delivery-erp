'use client';

import { Button, Checkbox, Separator } from '@heroui-v3/react';
import { Bell } from 'lucide-react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  useEtatRelancePreuvesQuery,
  useRelancerPreuvesMutation,
} from '@/features/turboys/queries/programme.query';
import type { IRelancePreuves } from '@/features/turboys/types/programme.types';
import { useAbility } from '@/hooks/use-ability';
import { formatMontant } from '@/utils/format.utils';

/**
 * LA RELANCE GROUPÉE DES PREUVES WAVE (RG-W07, CA-56).
 *
 * <h3>Pourquoi en un clic</h3>
 *
 * <p>Un mercredi ordinaire, sept livreurs n'ont pas envoyé leur capture. Les relancer un
 * par un demande d'ouvrir sept programmes et d'envoyer sept notifications — ce que
 * personne ne fait, donc les preuves n'arrivent jamais, et la comptabilité se retrouve
 * en fin de mois avec un trou qu'elle ne peut plus reconstituer.</p>
 *
 * <p><b>Tous cochés à l'ouverture</b> : le geste normal est de relancer tout le monde,
 * et la sélection sert aux exceptions — quelqu'un qu'on vient d'avoir au téléphone.</p>
 *
 * <p>La fenêtre montre les JOURS et les MONTANTS concernés. Relancer quelqu'un sans
 * savoir sur quoi, c'est l'obliger à chercher ce qu'on lui demande.</p>
 */

const LIBELLE_JOUR: Record<string, string> = {
  DIMANCHE: 'Dim',
  JEUDI: 'Jeu',
  LUNDI: 'Lun',
  MARDI: 'Mar',
  MERCREDI: 'Mer',
  SAMEDI: 'Sam',
  VENDREDI: 'Ven',
};

const heure = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;

/** La ligne du bandeau, sans aucune requête : ce que le banc montre. */
export function LigneRelancePreuves({
  enCours = false,
  etat,
  onOuvrir,
  peutRelancer,
}: {
  enCours?: boolean;
  etat: IRelancePreuves | null | undefined;
  onOuvrir: () => void;
  peutRelancer: boolean;
}) {
  // Rien ne manque : on se tait. Un « 0 manquante » permanent n'apprend rien.
  if (!etat || etat.nbManquantes === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-danger-soft-foreground">
        {etat.nbManquantes} preuve{etat.nbManquantes > 1 ? 's' : ''} Wave manquante
        {etat.nbManquantes > 1 ? 's' : ''}
      </span>
      {peutRelancer ? (
        <Button isPending={enCours} onPress={onOuvrir} size="sm" variant="outline">
          <Bell aria-hidden="true" className="size-4" />
          Relancer les {etat.nbManquantes} manquantes
        </Button>
      ) : (
        <span className="text-xs text-muted">La relance revient à la comptabilité.</span>
      )}
    </div>
  );
}

export interface RelancePreuvesDialogProps {
  annee: number;
  semaine: number;
  ouvert: boolean;
  onFermer: () => void;
}

export function RelancePreuvesDialog({ annee, semaine, ouvert, onFermer }: RelancePreuvesDialogProps) {
  const etatQuery = useEtatRelancePreuvesQuery(annee, semaine, ouvert);
  const relancer = useRelancerPreuvesMutation(onFermer);
  const [exclus, setExclus] = React.useState<Set<string>>(new Set());

  const livreurs = etatQuery.data?.livreurs ?? [];

  // Tous cochés à l'ouverture : on mémorise les EXCLUS, pas les inclus, pour qu'un
  // livreur apparu entre-temps soit coché lui aussi plutôt qu'oublié.
  React.useEffect(() => {
    if (ouvert) setExclus(new Set());
  }, [ouvert]);

  const choisis = livreurs.filter((l) => !exclus.has(l.programmeId));
  const total = choisis.reduce((n, l) => n + l.nbManquantes, 0);

  return (
    <FenetreAction
      actionInactive={choisis.length === 0}
      enAttente={relancer.isPending}
      libelleAction={`Envoyer la relance (${choisis.length})`}
      onAction={() =>
        relancer.mutate({
          annee,
          // Tous choisis = on n'envoie pas de liste : le serveur relance tout le monde,
          // y compris un retard apparu entre l'ouverture de la fenêtre et le clic.
          programmeIds: exclus.size === 0 ? undefined : choisis.map((l) => l.programmeId),
          semaine,
        })
      }
      onFermer={onFermer}
      ouvert={ouvert}
      titre={`Relancer les preuves Wave — semaine ${semaine} / ${annee}`}
    >
      <div className="flex flex-col gap-3">
        {etatQuery.isLoading ? (
          <p className="text-sm text-muted">Lecture des preuves manquantes…</p>
        ) : livreurs.length === 0 ? (
          <p className="text-sm text-muted">Aucune preuve ne manque pour cette semaine.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {total} preuve{total > 1 ? 's' : ''} manquante{total > 1 ? 's' : ''} chez {choisis.length} livreur
              {choisis.length > 1 ? 's' : ''}. Chacun reçoit une notification nommant les jours concernés.
            </p>
            <Separator />
            <ul className="flex flex-col divide-y divide-separator">
              {livreurs.map((l) => (
                <li className="flex items-start gap-3 py-2" key={l.programmeId}>
                  <Checkbox
                    isSelected={!exclus.has(l.programmeId)}
                    onChange={(coche) =>
                      setExclus((avant) => {
                        const apres = new Set(avant);
                        if (coche) apres.delete(l.programmeId);
                        else apres.add(l.programmeId);
                        return apres;
                      })
                    }
                    slot={null}
                  >
                    <Checkbox.Indicator />
                  </Checkbox>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{l.livreurNom}</span>
                    <span className="text-xs text-muted">
                      {l.versements
                        .map((v) => `${LIBELLE_JOUR[v.jour] ?? v.jour} ${formatMontant(v.montant)}${v.surplus ? ' (surplus)' : ''}`)
                        .join(' · ')}
                    </span>
                    {l.relanceLe ? (
                      <span className="text-xs text-muted">Déjà relancé à {heure(l.relanceLe)}</span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatMontant(l.montantManquant)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </FenetreAction>
  );
}

/** La ligne branchée : lecture, droit, ouverture de la fenêtre. */
export function RelancePreuvesConnectee({ annee, semaine }: { annee: number; semaine: number }) {
  const ability = useAbility();
  const peutRelancer = ability.can('relancer-preuve', 'ProgrammeLivreur');
  const etatQuery = useEtatRelancePreuvesQuery(annee, semaine);
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <>
      <LigneRelancePreuves
        etat={etatQuery.data}
        onOuvrir={() => setOuvert(true)}
        peutRelancer={peutRelancer}
      />
      <RelancePreuvesDialog annee={annee} onFermer={() => setOuvert(false)} ouvert={ouvert} semaine={semaine} />
    </>
  );
}
