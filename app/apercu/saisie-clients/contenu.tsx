'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';

import { GrilleSaisie } from '@/components/bdd-clients/saisie/grille-saisie';
import { ligneVide, type IVerdictLigne, type LigneGrille } from '@/features/bdd-clients';

/**
 * Le banc de la GRILLE de saisie.
 *
 * <p>Il monte le vrai composant, avec des verdicts fabriqués. Ce qu'on vient regarder :
 * la densité sur la fenêtre réelle des postes, la lisibilité des quatre états, et le fait
 * qu'une seule couleur parle. Le collage depuis Excel est réel ici : coller un bloc de
 * cellules dans une case le vérifie pour de bon.</p>
 *
 * <p>⚠ L'orchestrateur, lui, n'est pas sur ce banc : son contrôle est un appel réseau
 * authentifié, et il n'a de sens que contre un vrai serveur avec une vraie session.</p>
 */

const VERDICTS: IVerdictLigne[] = [
  { clientId: null, dejaChezCePartenaire: false, etat: 'NOUVEAU', index: 1, motif: null, nbCaptures: 0, telephoneE164: '+2250709444401' },
  { clientId: 'c2', dejaChezCePartenaire: true, etat: 'CONNU', index: 2, motif: null, nbCaptures: 7, telephoneE164: '+2250501020304' },
  { clientId: 'c3', dejaChezCePartenaire: false, etat: 'CONNU', index: 3, motif: null, nbCaptures: 2, telephoneE164: '+2250102030405' },
  { clientId: null, dejaChezCePartenaire: false, etat: 'BLOQUE', index: 4, motif: 'Préfixe 09 inconnu : les numéros ivoiriens commencent par 01, 05, 07 ou 27.', nbCaptures: 0, telephoneE164: null },
  { clientId: null, dejaChezCePartenaire: false, etat: 'BLOQUE', index: 5, motif: 'Le check 111025 est déjà saisi pour ce partenaire.', nbCaptures: 0, telephoneE164: '+2250709444402' },
];

const DEPART: LigneGrille[] = [
  { articles: '2 poulets braisés', contact: '0709444401', montant: '21500', nom: 'KOFFI', numCheck: '111020', prenom: 'ABOU', zoneSaisie: 'MARCORY RÉSIDENTIEL' },
  { articles: '', contact: '0501020304', montant: '16000', nom: "N'DRI", numCheck: '111021', prenom: '', zoneSaisie: 'DJOROBITÉ CITÉ' },
  { articles: 'Livraison offerte', contact: '0102030405', montant: '8250', nom: 'SANNA', numCheck: '111022', prenom: '', zoneSaisie: 'COCODY' },
  { articles: '', contact: '0909444401', montant: '', nom: 'MAUVAIS NUMÉRO', numCheck: '', prenom: '', zoneSaisie: '' },
  { articles: '', contact: '0709444402', montant: '12000', nom: 'DOUBLON', numCheck: '111025', prenom: '', zoneSaisie: 'PLATEAU' },
  ligneVide(),
  ligneVide(),
];

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark`, et sur un div imbriqué c'est
 * le triplet qui gagne.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
  const [sombre, setSombre] = React.useState(false);
  React.useEffect(() => {
    const html = document.documentElement;
    const avant = html.className;
    html.className = sombre ? 'dark' : 'light';
    return () => {
      html.className = avant;
    };
  }, [sombre]);
  return [sombre, setSombre];
}

export default function ApercuSaisieClients() {
  const [sombre, setSombre] = useThemeSombre();
  const [avecVerdicts, setAvecVerdicts] = React.useState(true);
  const [etroit, setEtroit] = React.useState(true);
  const [grille, setGrille] = React.useState<LigneGrille[]>(DEPART);
  const [tronque, setTronque] = React.useState(0);

  const verdicts = React.useMemo(
    () => (avecVerdicts ? new Map(VERDICTS.map((v) => [v.index, v])) : new Map()),
    [avecVerdicts],
  );

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
          <h1 className="text-xl font-semibold text-foreground">Grille de saisie en lot</h1>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button onPress={() => setSombre((p) => !p)} size="sm" variant="ghost">
            {sombre ? 'Clair' : 'Sombre'}
          </Button>
          <Button onPress={() => setAvecVerdicts((p) => !p)} size="sm" variant="ghost">
            {avecVerdicts ? 'Sans verdicts' : 'Avec verdicts'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} size="sm" variant="ghost">
            {etroit ? '1000 px' : 'Pleine largeur'}
          </Button>
          <Button onPress={() => setGrille(DEPART)} size="sm" variant="ghost">
            Réinitialiser
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Aucun appel réseau. Le collage est RÉEL : copier un bloc de cellules depuis un
        tableur et le coller dans une case remplit la grille et l&apos;étend si besoin.
        Entrée descend d&apos;une ligne, Tab traverse.
        {tronque > 0 ? ` ${tronque} ligne(s) écartée(s) au dernier collage.` : ''}
      </p>

      <div style={etroit ? { maxWidth: 1000 } : undefined}>
        <GrilleSaisie
          grille={grille}
          maximum={50}
          onChange={setGrille}
          onTronque={setTronque}
          verdicts={verdicts}
        />
      </div>
    </main>
  );
}
