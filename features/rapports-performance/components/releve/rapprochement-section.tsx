'use client';

import { Banknote, Landmark, Percent, Scale } from 'lucide-react';
import { Card } from '@heroui-v3/react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import type { IReleveReglement } from '@/features/virements';
import { formatMontant } from '@/utils/format.utils';

interface RapprochementSectionProps {
  /** NUL tant qu'aucune sélection n'est faite : la section dit alors pourquoi. */
  reglement?: IReleveReglement;
  enChargement?: boolean;
  enEchec?: boolean;
  /** Vrai dès qu'un groupe ou un établissement est choisi. */
  selectionFaite: boolean;
}

/**
 * LE RAPPROCHEMENT BANCAIRE : ce que la banque a reçu, en face de ce qu'on a facturé.
 *
 * <h3>Les trois questions</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : le Gap. Les trois chiffres qui le précèdent
 *       ne sont là que pour l'expliquer — facturé, moins les virements reçus, moins la
 *       retenue bancaire. C'est le seul nombre de cet écran qui dise ce qui reste dû
 *       d'après la BANQUE, et non d'après nos propres factures.</li>
 *   <li><b>Ce qui appelle un geste</b> : un Gap positif, et l'absence de payeur
 *       rattaché. Rien d'autre n'est peint.</li>
 *   <li><b>La forme naturelle</b> : quatre chiffres alignés qui se lisent comme une
 *       soustraction, de gauche à droite, dans l'ordre où le relevé les imprime.</li>
 * </ul>
 *
 * <h3>⚠ Pourquoi ce bloc existe À CÔTÉ du recouvrement</h3>
 * <p>Les deux ne mesurent pas la même chose, et les confondre est précisément ce que la
 * spécification du relevé reproche à l'existant. « Recouvré » vient des FACTURES, c'est
 * {@code montant − restant} : un crédit porté à la main, sans date ni preuve
 * d'encaissement, et qui s'efface quand une facture est réinitialisée. « Réglé » vient
 * des VIREMENTS saisis depuis un relevé bancaire, avec leur référence et leur date de
 * valeur. Le premier dit ce que nous avons décidé, le second ce que la banque a reçu.</p>
 *
 * <p>Quand les deux divergent, ce n'est pas un bogue : c'est l'information. Le relevé
 * existe pour la rendre visible.</p>
 */
export function RapprochementSection({
  enChargement = false,
  enEchec = false,
  reglement,
  selectionFaite,
}: RapprochementSectionProps) {
  if (!selectionFaite) {
    return (
      <Card>
        <Card.Content className="gap-1 p-6">
          <h2 className="text-xl font-semibold text-foreground">Rapprochement bancaire</h2>
          <p className="text-sm text-muted">
            Choisissez un partenaire, plusieurs partenaires ou un groupe pour comparer ce
            qui a été facturé à ce que la banque a réellement reçu. Sans sélection, il
            n&apos;y a pas de payeur, donc rien à rapprocher.
          </p>
        </Card.Content>
      </Card>
    );
  }

  /*
   * ⚠ LE PAYEUR MANQUANT N'EST PAS UN ZÉRO.
   *
   * Sans payeur rattaché, le serveur rend bien `montantRegle: 0` — mais ce zéro veut
   * dire « on ne sait pas qui paie », pas « rien n'a été payé ». Affiché tel quel, il
   * annoncerait un Gap égal à la facture entière : un impayé total, là où il n'y a qu'un
   * paramétrage absent. C'est la même faute que les cartes qui affirmaient « 0 FCFA »
   * sur une lecture en échec, et elle se corrige de la même façon : un tiret, et la
   * raison écrite à côté.
   */
  const payeurManquant = Boolean(reglement?.aucunPayeurRattache);
  const chiffreInconnu = enEchec || payeurManquant;

  /*
   * ⚠ Le TIRET est le même, la RAISON ne l'est pas.
   *
   * Sans ce motif, la carte annonce « la lecture a échoué » au lecteur d'écran — alors
   * que la lecture a parfaitement réussi, et que le bandeau juste au-dessus dit la vraie
   * raison. L'écran se contredisait à dix centimètres, pour qui l'entend.
   */
  const motifIndisponible = enEchec
    ? undefined
    : payeurManquant
      ? "aucun payeur n'est rattaché à cette sélection"
      : undefined;

  /*
   * ⚠ Pendant la PREMIÈRE lecture, aucune note n'affirme quoi que ce soit.
   *
   * Les notes se calculent depuis `reglement`, qui est indéfini tant que la réponse
   * n'est pas là : le `gap` retombait alors à 0, et les cartes en squelette portaient
   * « Facturé et encaissé concordent au franc » et « Aucune retenue paramétrée ». Deux
   * affirmations sous un chiffre qui n'existe pas encore.
   *
   * ⚠ Même règle quand le chiffre est INCONNU : annoncer « retenue de 2 % sur chaque
   * virement » à côté d'un prélèvement qui rend un tiret, c'est affirmer un détail d'un
   * montant qu'on vient de dire ignorer.
   */
  const donneeLue = Boolean(reglement) && !enChargement;

  const gap = reglement?.gap ?? 0;
  const resteDu = !chiffreInconnu && gap > 0;

  return (
    <Card>
      <Card.Content className="gap-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Rapprochement bancaire</h2>
          <p className="mt-1 text-sm text-muted">
            Les quatre chiffres du relevé de compte, dans l&apos;ordre où il les imprime.
            Ce bloc et les deux relevés exportés lisent la même source.
          </p>
        </div>

        {payeurManquant && (
          <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-warning-soft-foreground">
            Aucun payeur n&apos;est rattaché à cette sélection. Le montant réglé et le Gap
            sont donc inconnus, et non nuls : rattachez un payeur depuis Recouvrement,
            Virements reçus pour que le rapprochement devienne lisible.
          </p>
        )}

        {!payeurManquant && reglement?.payeurDeborde && (
          <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-warning-soft-foreground">
            Un payeur de cette sélection règle aussi des établissements qui n&apos;en font
            pas partie. Le montant réglé ci-dessous porte sur tous ses virements : il ne
            peut pas être attribué à cette seule sélection sans ventilation manuelle.
          </p>
        )}

        <GrilleStats className="xl:grid-cols-4" colonnes={2}>
          {/* Ce que nous facturons — le même montant qu'en tête de page, lu à la même
              source que l'export. Il informe, il n'appelle aucun geste ici. */}
          <CarteStat
            libelle="Facturé sur la période"
            isError={enEchec}
            isLoading={enChargement}
            valeur={reglement ? formatMontant(reglement.montantFacture) : '—'}
            note="Frais de livraison et commission des tickets facturables"
            icone={Banknote}
            ton="neutre"
          />

          {/* Ce que la BANQUE a reçu. */}
          <CarteStat
            libelle="Réglé par virement"
            isError={chiffreInconnu}
            isLoading={enChargement}
            valeur={reglement ? formatMontant(reglement.montantRegle) : '—'}
            motifIndisponible={motifIndisponible}
            note="Virements bancaires saisis, hors virements annulés"
            icone={Landmark}
            ton="succes"
          />

          <CarteStat
            libelle="Prélèvement"
            isError={chiffreInconnu}
            isLoading={enChargement}
            valeur={reglement ? formatMontant(reglement.prelevement) : '—'}
            motifIndisponible={motifIndisponible}
            note={
              !donneeLue || chiffreInconnu
                ? undefined
                : reglement?.tauxApplique
                  ? `Retenue de ${reglement.tauxApplique} % sur chaque virement`
                  : 'Aucune retenue paramétrée pour cette sélection'
            }
            icone={Percent}
            ton="neutre"
          />

          {/*
           * Le Gap. ⚠ Il n'est peint EN DANGER que s'il reste dû. Un Gap négatif veut
           * dire que la banque a reçu plus que ce que nous avons facturé sur la période,
           * ce qui arrive quand un virement règle des factures antérieures : c'est une
           * question, pas une alarme.
           */}
          <CarteStat
            accent={resteDu}
            libelle="Gap"
            isError={chiffreInconnu}
            isLoading={enChargement}
            valeur={reglement ? formatMontant(gap) : '—'}
            motifIndisponible={motifIndisponible}
            note={
              !donneeLue
                ? undefined
                : payeurManquant
                  ? "Inconnu tant qu'aucun payeur n'est rattaché"
                  : enEchec
                    ? 'Inconnu : la lecture a échoué'
                    : gap > 0
                      ? 'Reste dû après virements et prélèvement'
                      : gap < 0
                        ? 'Les virements dépassent la période : ils règlent sans doute des factures antérieures'
                        : 'Facturé et encaissé concordent au franc'
            }
            icone={Scale}
            ton={resteDu ? 'danger' : 'neutre'}
          />
        </GrilleStats>

        <p className="text-xs text-muted">
          «&nbsp;Réglé&nbsp;» vient des virements bancaires, avec leur référence et leur
          date de valeur. «&nbsp;Recouvré&nbsp;», dans le bloc du recouvrement, vient des
          factures&nbsp;: c&apos;est un crédit porté à la main, sans preuve
          d&apos;encaissement, et il s&apos;efface quand une facture est réinitialisée. Les
          deux peuvent donc différer — et c&apos;est cette différence que le relevé de
          compte existe pour montrer.
        </p>
      </Card.Content>
    </Card>
  );
}
