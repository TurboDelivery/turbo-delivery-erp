'use client';

import { Button, Card, Popover, Separator } from '@heroui-v3/react';
import { Settings2, UserPlus } from 'lucide-react';
import React from 'react';

import type { IProgramme } from '@/features/turboys/types/programme.types';
import { couvertureSemaine, JOURS_SEMAINE, type LigneCouverture } from '@/features/turboys/utils/couverture.utils';
import { cn } from '@/lib/utils';

/**
 * LA VUE COUVERTURE (§5.2, dernier point) : les sites en lignes, les jours en colonnes.
 *
 * <h3>Pourquoi elle existe à côté de la liste</h3>
 *
 * <p>La liste répond à « ce livreur a-t-il son programme ? ». Elle ne répond pas à
 * « qui est à Yopougon jeudi ? », et c'est pourtant la question du terrain. Avec trente-huit
 * programmes, personne ne recompose mentalement une grille site × jour à partir de
 * trente-huit lignes de livreurs : on compte sur ses doigts, on se trompe, et un site se
 * retrouve sans personne un dimanche.</p>
 *
 * <p><b>Pas de minimum par site</b> (décision du 22/11, §5.3). Une case ne dit donc pas
 * « sous-doté » : elle dit combien de livreurs sont prévus, et seule une case à ZÉRO est
 * signalée. C'est la seule affirmation que les données permettent.</p>
 *
 * <p>⚠ Ce n'est pas un {@code Table} v3 et c'est voulu : la v3 rend un
 * {@code <table role="grid">} où les flèches naviguent entre cellules, et chaque case ici
 * porte un bouton qui ouvre une liste. Les deux comportements de clavier se marcheraient
 * dessus. C'est la même exception que l'état financier, documentée au même titre.</p>
 */

export interface VueCouvertureProps {
  programmes: IProgramme[];
  /** Nom d'un site par identifiant. Un site inconnu garde son identifiant, jamais rien. */
  nomSite: Map<string, string>;
  /** Affecter un renfort sur ce site, ce jour (RG-S08). Absent : le bouton n'apparaît pas. */
  onAffecterRenfort?: (siteId: string, jour: string) => void;
  /** Ouvrir la configuration des couvertures (§8.5). Absent : le bouton n'apparaît pas. */
  onConfigurer?: () => void;
  isLoading?: boolean;
}

const JOURS_COURTS: Record<string, string> = {
  DIMANCHE: 'Dim',
  JEUDI: 'Jeu',
  LUNDI: 'Lun',
  MARDI: 'Mar',
  MERCREDI: 'Mer',
  SAMEDI: 'Sam',
  VENDREDI: 'Ven',
};

/**
 * Une case : le nombre de livreurs prévus, et ce qu'il y a dessous.
 *
 * <p>Le zéro est le seul état coloré. Un 3 et un 4 sont deux faits ordinaires ; les
 * peindre tous les deux ferait de la grille un vitrail où le zéro ne ressortirait plus.</p>
 */
function Case({
  jour,
  ligne,
  nomsLivreurs,
  onAffecterRenfort,
  siteNom,
}: {
  jour: string;
  ligne: LigneCouverture;
  nomsLivreurs: Map<string, string>;
  onAffecterRenfort?: () => void;
  siteNom: string;
}) {
  const nb = ligne.parJour[jour] ?? 0;
  const ids = ligne.livreursParJour[jour] ?? [];
  const vide = nb === 0;

  return (
    <Popover>
      <Button
        aria-label={`${siteNom}, ${JOURS_COURTS[jour] ?? jour} : ${nb} livreur${nb > 1 ? 's' : ''}`}
        className={cn(
          'h-9 w-full justify-center rounded-md border tabular-nums',
          vide
            ? 'border-danger/40 bg-danger/10 font-semibold text-danger-soft-foreground'
            : 'border-default-200 bg-content1 font-medium text-foreground hover:border-default-400',
        )}
        variant="ghost"
      >
        {nb}
      </Button>
      <Popover.Content className="w-64">
        <div className="flex flex-col gap-2 p-1">
          <div>
            <p className="text-sm font-semibold text-foreground">{siteNom}</p>
            <p className="text-xs text-muted">{JOURS_COURTS[jour] ?? jour}</p>
          </div>
          <Separator />
          {ids.length === 0 ? (
            <p className="text-sm text-danger-soft-foreground">Aucun livreur prévu ce jour-là.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {ids.map((id) => (
                <li className="text-sm text-foreground" key={id}>
                  {nomsLivreurs.get(id) ?? id}
                </li>
              ))}
            </ul>
          )}
          {onAffecterRenfort ? (
            <Button className="w-full" onPress={onAffecterRenfort} size="sm" variant="outline">
              <UserPlus aria-hidden="true" className="size-4" />
              Affecter un renfort
            </Button>
          ) : null}
        </div>
      </Popover.Content>
    </Popover>
  );
}

export function VueCouverture({
  programmes,
  nomSite,
  onAffecterRenfort,
  onConfigurer,
  isLoading = false,
}: VueCouvertureProps) {
  const couverture = React.useMemo(() => couvertureSemaine(programmes), [programmes]);

  /*
   * La même clé que le calcul : `livreurId ?? id du programme`. Un programme sans
   * livreur rattaché reste une présence prévue ; faute de nom, la case affichera son
   * identifiant plutôt que de l'omettre.
   */
  const nomsLivreurs = React.useMemo(
    () => new Map(programmes.map((p) => [p.livreurId ?? p.id, p.livreurNom ?? 'Livreur sans nom'])),
    [programmes],
  );

  /* Les sites à problème d'abord : c'est la raison d'ouvrir cette vue. Puis l'alphabet. */
  const lignes = React.useMemo(() => {
    const nom = (l: LigneCouverture) => nomSite.get(l.siteId) ?? l.siteId;
    return [...couverture.lignes].sort((a, b) => b.trous - a.trous || nom(a).localeCompare(nom(b), 'fr'));
  }, [couverture.lignes, nomSite]);

  if (isLoading) {
    return (
      <Card>
        <Card.Content className="gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div className="h-9 animate-pulse rounded-md bg-default-200" key={i} />
          ))}
        </Card.Content>
      </Card>
    );
  }

  if (lignes.length === 0) {
    return (
      <Card>
        <Card.Content>
          <p className="py-8 text-center text-sm text-muted">
            Aucun site au programme de cette semaine. La couverture se lit à partir des programmes.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {couverture.sitesCouverts} site{couverture.sitesCouverts > 1 ? 's' : ''} couvert
            {couverture.sitesCouverts > 1 ? 's' : ''} sur {couverture.sitesAuProgramme}
            {couverture.trous > 0 ? (
              <>
                {' · '}
                <span className="font-medium text-danger-soft-foreground">
                  {couverture.trous} case{couverture.trous > 1 ? 's' : ''} sans personne
                </span>
              </>
            ) : null}
          </p>
          {onConfigurer ? (
            <Button onPress={onConfigurer} size="sm" variant="outline">
              <Settings2 aria-hidden="true" className="size-4" />
              Configuration des couvertures
            </Button>
          ) : null}
        </div>

        {/* La grille défile horizontalement sous 760 px, les noms de site restant collés. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-separate border-spacing-x-1 border-spacing-y-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-content1 text-left text-xs font-medium text-muted" scope="col">
                  Site
                </th>
                {JOURS_SEMAINE.map((j) => (
                  <th className="w-16 text-center text-xs font-medium text-muted" key={j} scope="col">
                    {JOURS_COURTS[j]}
                  </th>
                ))}
                <th className="w-20 text-right text-xs font-medium text-muted" scope="col">
                  Trous
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const siteNom = nomSite.get(l.siteId) ?? l.siteId;
                return (
                  <tr key={l.siteId}>
                    <th
                      className="sticky left-0 z-10 max-w-[14rem] truncate bg-content1 pe-2 text-left text-sm font-medium text-foreground"
                      scope="row"
                      title={siteNom}
                    >
                      {siteNom}
                    </th>
                    {JOURS_SEMAINE.map((j) => (
                      <td key={j}>
                        <Case
                          jour={j}
                          ligne={l}
                          nomsLivreurs={nomsLivreurs}
                          onAffecterRenfort={onAffecterRenfort ? () => onAffecterRenfort(l.siteId, j) : undefined}
                          siteNom={siteNom}
                        />
                      </td>
                    ))}
                    <td className="text-right text-sm tabular-nums">
                      <span className={cn(l.trous > 0 ? 'font-semibold text-danger-soft-foreground' : 'text-muted')}>
                        {l.trous}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card.Content>
    </Card>
  );
}
