import { Package, Receipt, Users, Wallet } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

/** Ce dont le bandeau a besoin : une ligne de la liste, réduite à ses quantités. */
export interface LignePeriode {
  nbTickets?: number | null;
  commission?: number | null;
  prime?: number | null;
}

/**
 * La synthèse d'une période de PLUSIEURS semaines, exigence 2.3.
 *
 * <h3>Pourquoi ce bandeau existe à côté de l'autre</h3>
 * <p>{@link BandeauFlotte} lit la grille de paie d'UN créneau, et c'est la référence : sur
 * une semaine, la paie fait autorité. Mais un créneau EST une semaine. Sur un mois il y en a
 * quatre ou cinq, et montrer les totaux de l'un d'eux serait faux.</p>
 *
 * <p>Ce bandeau-ci additionne donc les lignes affichées en dessous, et il le DIT. C'est une
 * autre grandeur, pas la même vue plus large : la paie compte les tickets par appartenance à
 * un créneau, ces lignes les comptent par date de course. Laisser croire que les deux sont
 * interchangeables reviendrait à donner deux chiffres officiels pour une même question.</p>
 *
 * <p>Il ne porte donc NI net à payer NI numéro Wave manquant : ces deux-là n'existent que
 * dans la paie, et les fabriquer à partir des lignes serait une invention.</p>
 */
export function BandeauPeriode({
  libelle,
  lignes,
}: {
  libelle: string;
  lignes: LignePeriode[];
}) {
  const nbTickets = lignes.reduce((n, l) => n + (l.nbTickets ?? 0), 0);
  const commission = lignes.reduce((n, l) => n + (l.commission ?? 0), 0);
  const prime = lignes.reduce((n, l) => n + (l.prime ?? 0), 0);
  const ontRoule = lignes.filter((l) => (l.nbTickets ?? 0) > 0).length;

  return (
    <section aria-label="Synthèse de la période" className="space-y-2">
      <GrilleStats className="xl:grid-cols-4" colonnes={2}>
        <CarteStat
          icone={Users}
          libelle="Livreurs"
          note={`${formatNumber(ontRoule)} ont roulé sur la période`}
          ton="neutre"
          valeur={formatNumber(lignes.length)}
        />

        <CarteStat
          icone={Package}
          libelle="Livraisons"
          note="Comptées par date de course"
          ton="danger"
          valeur={formatNumber(nbTickets)}
        />

        <CarteStat
          icone={Receipt}
          libelle="Commission"
          note="Part livreur des frais de livraison"
          ton="neutre"
          valeur={formatMontant(commission)}
        />

        {/*
         * La prime est HEBDOMADAIRE : elle se declenche sur un seuil de brut et un seuil de
         * presence sur SEPT jours. Le serveur la calcule semaine par semaine puis la somme,
         * ce qui est la maniere dont la paie la verse. La note en dessous le dit, parce
         * qu'un total de primes sur un mois ne se verifie pas d'un coup d'oeil.
         */}
        <CarteStat
          icone={Wallet}
          libelle="Primes"
          note="Semaine par semaine, puis cumulées"
          ton="attention"
          valeur={formatMontant(prime)}
        />
      </GrilleStats>

      <p className="text-xs text-muted">
        {libelle}&nbsp;: totaux calculés sur les lignes ci-dessous, et non sur les grilles de
        paie. Un créneau de paie couvre une seule semaine&nbsp;; sur cette période il y en a
        plusieurs, et la synthèse de la paie n&apos;est donc pas disponible. Les semaines
        entamées aux bornes de la période sont jugées sur leurs seuls jours compris dedans,
        ce qui peut leur faire manquer le seuil de prime.
      </p>
    </section>
  );
}
