'use client';

import React from 'react';
import { Button, Label, ListBox, Select } from '@heroui-v3/react';
import { FileSpreadsheet, Upload } from 'lucide-react';

/**
 * Choisir le fichier, l'onglet, et la ligne d'en-tête.
 *
 * <h3>Pourquoi l'onglet se choisit, ici</h3>
 * <p>L'import des contacts impose la PREMIÈRE feuille. Les classeurs de suivi des
 * tickets en portent six ou sept — « Bon de livraison », « RELEVE DE PAIE INDEPENDANT
 * DEFINITIVE », « PAIE SEMAINE DU 23-29 SEPT »… Imposer la première reviendrait à
 * demander à l'opérateur de dupliquer son classeur pour déplacer un onglet, c'est-à-dire
 * exactement le passage par le tableur que cet écran existe pour supprimer.</p>
 *
 * <h3>Pourquoi la ligne d'en-tête se choisit aussi</h3>
 * <p>Sur ces mêmes classeurs, les premières lignes portent un titre, une bande de
 * couleur et des filtres : l'en-tête réelle est en ligne 5. Lue en ligne 1, toute la
 * table se décale et les colonnes s'appellent « Colonne 1 ». La ligne est devinée — la
 * première qui porte au moins trois cellules non vides — et reste modifiable.</p>
 */

/** Une feuille lue du classeur, gardée telle quelle. */
export interface IFeuilleLue {
  nom: string;
  grille: string[][];
}

const ACCEPTE = '.xlsx,.xls,.csv';

/**
 * La première ligne qui ressemble à une en-tête.
 *
 * <p>Trois cellules non vides : un titre de classeur en occupe une, une bande de
 * couleur zéro. Le seuil est volontairement bas, l'opérateur corrige d'un geste.</p>
 */
export function devinerLigneEntete(grille: string[][]): number {
  const trouvee = grille.findIndex(
    (ligne) => ligne.filter((c) => (c ?? '').trim() !== '').length >= 3,
  );
  return trouvee < 0 ? 0 : trouvee;
}

export function EtapeFichier({
  feuilleChoisie,
  feuilles,
  ligneEntete,
  nomFichier,
  onChoisirFeuille,
  onChoisirLigneEntete,
  onLire,
}: {
  feuilleChoisie: string;
  feuilles: IFeuilleLue[];
  ligneEntete: number;
  nomFichier: string;
  onChoisirFeuille: (nom: string) => void;
  onChoisirLigneEntete: (ligne: number) => void;
  onLire: (feuilles: IFeuilleLue[], nomFichier: string) => void;
}) {
  const entree = React.useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const lireLeFichier = async (fichier: File) => {
    setErreur(null);
    setEnCours(true);
    try {
      const { read, utils } = await import('xlsx');
      const octets = await fichier.arrayBuffer();
      const classeur = read(octets, { cellDates: false, raw: false, type: 'array' });

      const lues: IFeuilleLue[] = classeur.SheetNames.map((nom) => {
        /*
         * `header: 1` rend une grille de tableaux, pas des objets : c'est ce qu'attend
         * `construireTable`, et cela garde l'ordre des colonnes même quand deux portent
         * le même en-tête. `defval: ''` remplit les cellules vides, sans quoi SheetJS
         * les SAUTE et les colonnes se décalent d'une ligne à l'autre.
         */
        const grille = utils.sheet_to_json<string[]>(classeur.Sheets[nom], {
          blankrows: false,
          defval: '',
          header: 1,
          raw: false,
        });
        return {
          grille: grille
            .map((l) => (Array.isArray(l) ? l.map((c) => String(c ?? '')) : []))
            .filter((l) => l.some((c) => (c ?? '').trim() !== '')),
          nom,
        };
      }).filter((f) => f.grille.length > 0);

      if (lues.length === 0) {
        setErreur('Ce fichier ne contient aucune feuille remplie.');
        return;
      }
      onLire(lues, fichier.name);
    } catch {
      setErreur('Ce fichier n’a pas pu être lu. Les formats acceptés sont .xlsx, .xls et .csv.');
    } finally {
      setEnCours(false);
    }
  };

  const feuille = feuilles.find((f) => f.nom === feuilleChoisie);
  const apercuEntete = feuille?.grille[ligneEntete] ?? [];
  const nbLignesDonnees = feuille ? Math.max(0, feuille.grille.length - ligneEntete - 1) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
      <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
        1. Le fichier
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <input
          accept={ACCEPTE}
          className="hidden"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) void lireLeFichier(fichier);
            // Remettre la valeur à vide : sans cela, rouvrir le MÊME fichier après
            // l'avoir corrigé dans le tableur ne déclenche aucun événement.
            e.target.value = '';
          }}
          ref={entree}
          type="file"
        />
        <Button isDisabled={enCours} onPress={() => entree.current?.click()} variant="primary">
          <Upload aria-hidden className="size-4" />
          {enCours ? 'Lecture…' : 'Choisir un fichier'}
        </Button>
        {nomFichier ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <FileSpreadsheet aria-hidden className="size-4" />
            {nomFichier}
          </span>
        ) : (
          <span className="text-sm text-muted">Formats .xlsx, .xls et .csv.</span>
        )}
      </div>

      {erreur ? <p className="text-sm text-danger">{erreur}</p> : null}

      {feuilles.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            className="w-full"
            onSelectionChange={(k) => onChoisirFeuille(String(k ?? ''))}
            selectedKey={feuilleChoisie}
          >
            <Label>Onglet</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {feuilles.map((f) => (
                  <ListBox.Item id={f.nom} key={f.nom} textValue={f.nom}>
                    {f.nom} ({f.grille.length} lignes)
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="w-full"
            onSelectionChange={(k) => onChoisirLigneEntete(Number(k ?? 0))}
            selectedKey={String(ligneEntete)}
          >
            <Label>Ligne d’en-tête</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {/* Au-delà des quinze premières lignes, ce n'est plus un en-tête mais un
                    autre tableau : proposer tout le fichier rendrait la liste illisible. */}
                {(feuille?.grille ?? []).slice(0, 15).map((ligne, i) => (
                  <ListBox.Item id={String(i)} key={i} textValue={`Ligne ${i + 1}`}>
                    Ligne {i + 1} — {ligne.filter((c) => c.trim() !== '').slice(0, 4).join(' | ') || '(vide)'}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      ) : null}

      {feuille ? (
        <p className="text-xs text-muted">
          <span className="tabular-nums">{nbLignesDonnees}</span> ligne
          {nbLignesDonnees > 1 ? 's' : ''} de données sous l’en-tête{' '}
          <span className="text-foreground">
            {apercuEntete.filter((c) => c.trim() !== '').slice(0, 6).join(' · ') || '(vide)'}
          </span>
        </p>
      ) : null}
    </div>
  );
}
