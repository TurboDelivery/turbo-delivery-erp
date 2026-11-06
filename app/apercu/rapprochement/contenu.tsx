'use client';

import React, { useEffect, useState } from 'react';

import { RapprochementSection } from '@/features/rapports-performance/components/releve/rapprochement-section';
import type { IReleveReglement } from '@/features/virements';

/**
 * Banc du bloc « Rapprochement bancaire » du rapport de performance.
 *
 * <p>Six situations, dont quatre ne sont PAS atteignables en production sans fabriquer
 * la donnée : un groupe sans payeur rattaché, un payeur qui déborde la sélection, un Gap
 * négatif, une lecture en échec. Ce sont exactement celles où un écran se met à
 * affirmer un chiffre qu'il ne connaît pas.</p>
 *
 * <p>Ce qu'on vient vérifier : qu'aucune carte n'annonce « 0 FCFA » quand le montant est
 * INCONNU, que le Gap n'est peint qu'en cas de reste dû, et que les montants tiennent
 * sur une ligne.</p>
 */

const BASE: IReleveReglement = {
  montantFacture: 6_253_900,
  montantRegle: 2_219_542,
  prelevement: 45_297,
  montantCouvert: 2_264_839,
  gap: 3_989_061,
  tauxApplique: 2,
  aucunPayeurRattache: false,
  payeurDeborde: false,
  nombreEtablissements: 7,
};

const SITUATIONS: {
  cle: string;
  titre: string;
  propos: string;
  props: React.ComponentProps<typeof RapprochementSection>;
}[] = [
  {
    cle: 'resteDu',
    titre: 'Un Gap positif : il reste dû',
    propos:
      'Le seul cas où un chiffre est peint. Les trois cartes qui précèdent se lisent comme la soustraction qui mène au Gap.',
    props: { reglement: BASE, selectionFaite: true },
  },
  {
    cle: 'concorde',
    titre: 'Facturé et encaissé concordent',
    propos: 'Rien n’est peint, et la note le DIT plutôt que de laisser un zéro muet.',
    props: {
      reglement: { ...BASE, montantRegle: 6_131_275, prelevement: 122_625, montantCouvert: 6_253_900, gap: 0 },
      selectionFaite: true,
    },
  },
  {
    cle: 'negatif',
    titre: 'Gap négatif : la banque a reçu plus que la période',
    propos:
      'Ce n’est pas une alarme : un virement règle sans doute des factures antérieures. Donc aucun accent, et la note pose la question.',
    props: {
      reglement: { ...BASE, montantRegle: 8_000_000, prelevement: 163_265, montantCouvert: 8_163_265, gap: -1_909_365 },
      selectionFaite: true,
    },
  },
  {
    cle: 'sansPayeur',
    titre: 'Aucun payeur rattaché',
    propos:
      'Le serveur rend 0. Les cartes doivent rendre un TIRET : ce zéro veut dire « on ne sait pas qui paie », pas « rien n’a été payé ». Affiché tel quel, il annoncerait un impayé de 6,2 M.',
    props: {
      reglement: { ...BASE, montantRegle: 0, prelevement: 0, montantCouvert: 0, gap: 6_253_900, tauxApplique: null, aucunPayeurRattache: true },
      selectionFaite: true,
    },
  },
  {
    cle: 'deborde',
    titre: 'Un payeur qui déborde la sélection',
    propos:
      'Les chiffres sont lisibles, mais ils ne sont pas attribuables à cette seule sélection. Le bandeau le dit avant qu’on les lise.',
    props: { reglement: { ...BASE, payeurDeborde: true }, selectionFaite: true },
  },
  {
    cle: 'echec',
    titre: 'La lecture a échoué',
    propos:
      'Ne doit PAS se lire « 0 FCFA » : un directeur lirait une mauvaise nouvelle là où il n’y a qu’une panne.',
    props: { enEchec: true, reglement: BASE, selectionFaite: true },
  },
  {
    cle: 'sansSelection',
    titre: 'Aucune sélection',
    propos: 'L’état d’arrivée de la page. Le bloc explique son absence au lieu de disparaître.',
    props: { selectionFaite: false },
  },
  {
    cle: 'chargement',
    titre: 'Première lecture',
    propos: 'Des squelettes, jamais des zéros.',
    props: { enChargement: true, selectionFaite: true },
  },
];

export default function ApercuRapprochement() {
  const [sombre, setSombre] = useState(false);

  // ⚠ Le thème se bascule sur <html>, jamais sur une enveloppe : les jetons shadcn sont
  // encore déclarés en triplets HSL bruts dans la portée `.dark`, et sur un div imbriqué
  // c'est le triplet qui gagne — les couleurs sémantiques ne peignent alors plus rien.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre);
    return () => document.documentElement.classList.remove('dark');
  }, [sombre]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Banc — Rapprochement bancaire</h1>
            <p className="text-sm text-muted">
              Huit situations. Aucun appel réseau ne part.
            </p>
          </div>
          <button
            className="rounded-lg border border-default-200 px-3 py-2 text-sm"
            onClick={() => setSombre((s) => !s)}
            type="button"
          >
            {sombre ? 'Passer en clair' : 'Passer en sombre'}
          </button>
        </header>

        {SITUATIONS.map((situation) => (
          <section className="space-y-3" key={situation.cle}>
            <div>
              <h2 className="text-base font-semibold">{situation.titre}</h2>
              <p className="text-sm text-muted">{situation.propos}</p>
            </div>
            <RapprochementSection {...situation.props} />
          </section>
        ))}
      </div>
    </div>
  );
}
