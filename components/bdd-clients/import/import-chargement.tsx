'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';

import {
  analyserCollage,
  construireModeleImport,
  NOM_MODELE_IMPORT,
} from '@/features/bdd-clients';

/**
 * Charger le fichier, ou le coller.
 *
 * <h3>Les deux entrées, parce que les deux existent</h3>
 * <p>Certaines caisses exportent un fichier, d'autres n'exportent rien et l'opérateur
 * copie l'écran. Ne proposer que le fichier obligerait à passer par un tableur pour en
 * fabriquer un, ce qui est exactement le détour qu'on veut supprimer.</p>
 *
 * <h3>⚠ La bibliothèque de lecture est chargée À LA DEMANDE</h3>
 * <p>`xlsx` pèse plusieurs centaines de kilo-octets. L'importer en tête de module le
 * ferait entrer dans le paquet de tous les écrans de la base clients, y compris la liste
 * que l'on ouvre cent fois par jour et qui ne lit aucun fichier. Il n'est chargé qu'au
 * moment où un fichier est réellement déposé.</p>
 */
export function ImportChargement({
  onCharger,
}: {
  onCharger: (grille: string[][], source: string) => void;
}) {
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [fabriqueLeModele, setFabriqueLeModele] = React.useState(false);
  const champ = React.useRef<HTMLInputElement>(null);

  /*
   * Le téléchargement passe par une URL d'objet, révoquée aussitôt.
   *
   * Sans la révocation, chaque clic laisse le classeur en mémoire pour la durée de
   * l'onglet. Ce n'est pas anodin ici : l'écran d'import est celui où l'on reste, et
   * l'opérateur reprend le modèle autant de fois qu'il ouvre de fichiers.
   */
  const telechargerLeModele = async () => {
    setFabriqueLeModele(true);
    try {
      const contenu = await construireModeleImport();
      const url = URL.createObjectURL(contenu);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = NOM_MODELE_IMPORT;
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreur("Le modèle n'a pas pu être fabriqué. Réessaie dans un instant.");
    } finally {
      setFabriqueLeModele(false);
    }
  };

  const lireLeFichier = async (fichier: File) => {
    setErreur(null);
    setEnCours(true);
    try {
      const { read, utils } = await import('xlsx');
      const octets = await fichier.arrayBuffer();
      const classeur = read(octets, { cellDates: false, raw: false, type: 'array' });
      const premiere = classeur.SheetNames[0];
      if (!premiere) {
        setErreur("Ce fichier ne contient aucune feuille.");
        return;
      }
      /*
       * `header: 1` rend une grille de tableaux, pas des objets : c'est exactement ce
       * qu'attend `construireTable`, et cela garde les colonnes dans leur ordre même
       * quand deux d'entre elles portent le même en-tête.
       *
       * `defval: ''` remplit les cellules vides. Sans lui, SheetJS SAUTE les vides et
       * les colonnes se décalent d'une ligne à l'autre.
       */
      const grille = utils.sheet_to_json<string[]>(classeur.Sheets[premiere], {
        blankrows: false,
        defval: '',
        header: 1,
        raw: false,
      });
      const propre = grille
        .map((l) => (Array.isArray(l) ? l.map((c) => String(c ?? '')) : []))
        .filter((l) => l.some((c) => c.trim() !== ''));
      if (propre.length < 2) {
        setErreur(
          'Ce fichier ne contient que son en-tête. Si c’est le modèle, remplis la ' +
            'feuille « Contacts » : c’est la première qui est lue.',
        );
        return;
      }
      onCharger(propre, fichier.name);
    } catch {
      setErreur(
        'Ce fichier n’a pas pu être lu. Les formats acceptés sont .xlsx, .xls et .csv.',
      );
    } finally {
      setEnCours(false);
    }
  };

  const coller = (texte: string) => {
    const grille = analyserCollage(texte);
    if (grille.length < 2) {
      setErreur('Colle au moins une ligne d’en-tête et une ligne de données.');
      return;
    }
    setErreur(null);
    onCharger(grille, 'collage');
  };

  return (
    <div className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
      <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
        1. Le fichier
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <input
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) void lireLeFichier(fichier);
            // On vide le champ : sans cela, rechoisir LE MÊME fichier après une
            // correction ne déclenche aucun événement.
            e.target.value = '';
          }}
          ref={champ}
          type="file"
        />
        <Button isPending={enCours} onPress={() => champ.current?.click()} variant="primary">
          <Upload aria-hidden="true" className="size-4" />
          Choisir un fichier
        </Button>
        <span className="text-xs text-muted">.xlsx, .xls ou .csv</span>

        <div className="ms-auto flex items-center gap-2">
          <span className="text-xs text-muted">Pas de fichier sous la main ?</span>
          <Button
            isPending={fabriqueLeModele}
            onPress={() => void telechargerLeModele()}
            variant="ghost"
          >
            <Download aria-hidden="true" className="size-4" />
            Télécharger le modèle
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground">…ou colle le tableau</span>
        <textarea
          className="h-24 w-full rounded-medium border border-separator bg-surface px-2 py-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onPaste={(e) => {
            const texte = e.clipboardData.getData('text/plain');
            if (texte.trim() !== '') {
              e.preventDefault();
              coller(texte);
            }
          }}
          placeholder="Colle ici depuis Excel : la première ligne doit être l'en-tête."
        />
      </div>

      {erreur ? (
        <p className="flex items-center gap-2 rounded-medium bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
          <FileSpreadsheet aria-hidden="true" className="size-4 shrink-0" />
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
