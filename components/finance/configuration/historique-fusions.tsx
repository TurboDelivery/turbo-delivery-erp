'use client';

import { Button, Card } from '@heroui-v3/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GitMerge, Undo2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import {
  annulerFusionRequest,
  historiqueFusionsRequest,
  type IFusionCategorie,
} from '@/features/depenses/apis/fusion-categorie.api';

const dateLisible = (valeur: string | null) => {
  if (!valeur) return '-';
  try {
    return format(parseISO(valeur), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return valeur;
  }
};

const lignesDeplacees = (f: IFusionCategorie) =>
  (f.depensesIds?.length ?? 0)
  + (f.chargesFixesIds?.length ?? 0)
  + (f.chargesVariablesIds?.length ?? 0);

/**
 * L'HISTORIQUE DES FUSIONS DE CATÉGORIES, ET LEUR ANNULATION.
 *
 * <h3>Pourquoi cet écran existe</h3>
 * <p>Une fusion n'était pas annulable, et ce n'était pas un oubli : elle supprimait
 * définitivement la catégorie perdante, et déplaçait les lignes par un UPDATE en bloc
 * sans retenir lesquelles. On ne peut pas défaire ce qu'on n'a pas enregistré. Le serveur
 * tient maintenant un journal qui retient les identifiants déplacés, table par table, et
 * c'est lui que cet écran montre.</p>
 *
 * <h3>Ce que le bouton promet, et ce qu'il ne promet pas</h3>
 * <p>L'annulation rend EXACTEMENT les lignes retenues, et rien d'autre. Si l'une d'elles
 * a été reclassée depuis la fusion, le serveur refuse TOUT et le dit : une annulation à
 * moitié faite laisserait deux catégories dont aucune ne décrit la réalité. Ce refus
 * n'est pas une erreur à masquer, c'est le message le plus utile de cet écran, donc il
 * est affiché tel quel et la fenêtre reste ouverte.</p>
 *
 * <p>⚠ Les fusions antérieures au 20/11/2026 ne sont pas dans ce journal : elles ont été
 * faites avant qu'il existe, et leurs catégories perdantes ont été supprimées pour de
 * bon. Un journal vide ne veut donc pas dire qu'il n'y a jamais eu de fusion, et l'état
 * vide le dit plutôt que de laisser croire le contraire.</p>
 */
export function HistoriqueFusions({ nomsCategories }: { nomsCategories?: Map<string, string> } = {}) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const queryClient = useQueryClient();

  const [aAnnuler, setAAnnuler] = React.useState<IFusionCategorie | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ['depenses', 'fusions', 'historique'],
    queryFn: historiqueFusionsRequest,
    staleTime: 60 * 1000,
  });

  const annulation = useMutation({
    mutationFn: (fusion: IFusionCategorie) => annulerFusionRequest(fusion.id, userId ?? ''),
    onSuccess: (_, fusion) => {
      setAAnnuler(null);
      toast.success('Fusion annulée', {
        description: `La catégorie « ${fusion.categorieSourceNom} » est rétablie et ses `
          + `${lignesDeplacees(fusion)} ligne(s) lui sont rendues.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['depenses'] });
    },
    onError: (erreur) => {
      // Le refus du serveur est le message le plus utile de cet ecran : il dit COMBIEN de
      // lignes ont ete reclassees depuis la fusion. On ne le remplace pas par une phrase
      // generique, et la fenetre reste ouverte.
      toast.error("La fusion n'a pas été annulée", {
        description: erreur instanceof Error ? erreur.message : 'Une erreur est survenue',
        duration: 8000,
      });
    },
  });

  const colonnes: readonly ColonneResponsive<IFusionCategorie>[] = [
    {
      cle: 'categorie',
      identite: true,
      libelle: 'Catégorie fusionnée',
      rendu: (f) => (
        <div className="flex flex-col">
          <span className="font-medium">{f.categorieSourceNom}</span>
          {f.categorieSourceDescription && (
            <span className="text-xs text-muted">{f.categorieSourceDescription}</span>
          )}
        </div>
      ),
    },
    {
      cle: 'lignes',
      libelle: 'Lignes déplacées',
      rendu: (f) => (
        <div className="flex flex-col text-sm">
          <span className="tabular-nums">{lignesDeplacees(f)} au total</span>
          <span className="text-xs text-muted">
            {f.depensesIds?.length ?? 0} dépense(s), {f.chargesFixesIds?.length ?? 0} fixe(s),{' '}
            {f.chargesVariablesIds?.length ?? 0} variable(s)
          </span>
        </div>
      ),
    },
    {
      // « Fusionnée dans » (maquette) : le journal ne retient que l'IDENTIFIANT de la
      // catégorie gardée ; son nom est lu dans le référentiel, donc toujours à jour même si
      // elle a été renommée depuis.
      cle: 'cible',
      libelle: 'Fusionnée dans',
      rendu: (f) => (
        <span className="text-sm font-medium">{nomsCategories?.get(f.categorieCibleId) ?? '—'}</span>
      ),
    },
    {
      cle: 'quand',
      libelle: 'Fusionnée le',
      rendu: (f) => <span className="text-sm">{dateLisible(f.createdAt)}</span>,
    },
    {
      cle: 'etat',
      libelle: 'État',
      rendu: (f) =>
        f.annuleeAt ? (
          <span className="text-sm text-muted">Annulée le {dateLisible(f.annuleeAt)}</span>
        ) : (
          <span className="text-sm">En vigueur</span>
        ),
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (f) =>
        f.annuleeAt ? null : (
          <Button isDisabled={!userId} onPress={() => setAAnnuler(f)} size="sm" variant="outline">
            <Undo2 aria-hidden="true" className="size-4" />
            Annuler la fusion
          </Button>
        ),
    },
  ];

  const fusions = data ?? [];

  return (
    <>
      <Card>
        <Card.Header className="flex-row items-center gap-2">
          <GitMerge aria-hidden="true" className="size-4" />
          <span className="font-medium">Historique des fusions</span>
          {!isLoading && !isError && <span className="text-sm text-muted">{fusions.length}</span>}
        </Card.Header>
        <Card.Content>
          {/*
           * Le chargement, l'echec de lecture et la relance sont portes par le composant
           * partage : les refaire ici donnerait un cinquieme montage de la meme chose, et
           * c'est precisement ce que TableauResponsive existe pour eviter.
           */}
          <TableauResponsive
            cleLigne={(f) => f.id}
            colonnes={colonnes}
            enChargement={isLoading}
            enCoursDeRelance={isFetching}
            erreur={isError}
            libelle="Historique des fusions de catégories"
            lignes={fusions}
            onReessayer={() => refetch()}
            quoi="l'historique des fusions"
            vide="Aucune fusion enregistrée. Celles faites avant le 20 novembre 2026 n'y figurent pas : elles sont antérieures à ce journal et ne peuvent pas être annulées."
          />
        </Card.Content>
      </Card>

      <FenetreAction
        enAttente={annulation.isPending}
        libelleAction={annulation.isPending ? 'Annulation…' : 'Annuler la fusion'}
        onAction={() => aAnnuler && annulation.mutate(aAnnuler)}
        onFermer={() => setAAnnuler(null)}
        ouvert={aAnnuler !== null}
        titre="Annuler cette fusion"
      >
        {aAnnuler && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              La catégorie <strong>{aAnnuler.categorieSourceNom}</strong> sera rétablie, et les{' '}
              <strong>{lignesDeplacees(aAnnuler)}</strong> ligne(s) que cette fusion avait
              déplacées lui seront rendues.
            </p>
            <p className="text-muted">
              Les montants, les dates, les statuts et les validations ne bougent pas : seule la
              catégorie de rattachement change. Le total des dépenses de chaque mois est contrôlé
              avant et après, et tout est annulé au moindre écart.
            </p>
            <p className="text-muted">
              Si une de ces lignes a été reclassée depuis la fusion, rien ne sera modifié et le
              serveur dira combien.
            </p>
            {!userId && (
              <p className="text-warning">
                Votre session ne porte pas d&apos;identifiant : reconnectez-vous, le serveur
                refuse une annulation anonyme.
              </p>
            )}
          </div>
        )}
      </FenetreAction>
    </>
  );
}
