'use client';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { useInvestissementEncours } from '@/features/investissement/hooks/use-investissement-encours';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'encours des apports, en trois nombres qui s'additionnent.
 *
 * <h3>Ce qui change</h3>
 * <p>Quatre compteurs devenaient quatre zéros dès que la période choisie ne contenait aucun
 * mouvement, alors que la dette, elle, ne s'efface pas parce qu'on regarde un autre mois.
 * Ils lisent désormais toute l'histoire, et la période du haut de page a disparu avec eux :
 * elle ne pilotait rien d'autre, et c'est elle qui vidait l'écran.</p>
 *
 * <p>Trois cartes, pas quatre, et elles s'additionnent à l'œil : remboursé plus reste dû fait
 * le total investi. Le quatrième compteur, « à rembourser ce mois », rendait exactement le
 * même montant que « montant restant » sur toutes les fenêtres mesurées : deux fois le même
 * nombre sous deux noms différents. Le fait est dit sous les cartes plutôt que peint deux
 * fois, et l'échéancier ci-dessous porte les vraies dates.</p>
 */
export default function SyntheseInvestissements() {
  const { data, isError, isFetching, isLoading, refetch } = useInvestissementEncours();

  if (isError) {
    return (
      <div className="rounded-xl border border-separator bg-surface">
        <EtatErreur
          enCours={isFetching}
          onReessayer={() => void refetch()}
          quoi="l'encours des investissements"
        />
      </div>
    );
  }

  const investi = data?.totalInvestissement ?? 0;
  const rembourse = data?.totalRembourse ?? 0;
  const restant = data?.montantRestant ?? 0;

  /*
   * Le reste dû est le seul nombre de l'écran qui appelle un geste : c'est de l'argent à
   * sortir. Il porte donc la seule teinte. Tant qu'il est nul, la teinte n'aurait rien a
   * dire, et la carte reste neutre.
   */
  const tonRestant = restant > 0 ? 'attention' : 'neutre';

  return (
    <div className="flex flex-col gap-2">
      <GrilleStats colonnes={3}>
        <CarteStat
          isLoading={isLoading}
          libelle="Total investi"
          note="Depuis 2024, toutes échéances confondues"
          valeur={formatMontant(investi)}
        />
        <CarteStat isLoading={isLoading} libelle="Déjà remboursé" valeur={formatMontant(rembourse)} />
        <CarteStat
          accent={restant > 0}
          isLoading={isLoading}
          libelle="Reste dû"
          note={investi > 0 ? `${Math.round((restant / investi) * 100)} % du total investi` : undefined}
          ton={tonRestant}
          valeur={formatMontant(restant)}
        />
      </GrilleStats>

      {/*
       * On nomme le doublon du service au lieu de le peindre une seconde fois. Sans cette
       * ligne, un lecteur chercherait la difference entre deux cartes qui portent le meme
       * nombre, et conclurait a une erreur d'affichage.
       */}
      {!isLoading && (
        <p className="text-xs text-muted">
          Le service ne distingue pas les échéances du mois du reste dû : il rend le même
          montant pour les deux. Les dates d&apos;échéance réelles sont dans la liste ci-dessous.
        </p>
      )}
    </div>
  );
}
