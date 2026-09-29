import { describe, expect, it } from 'vitest';

import { analyserMontant } from './grille.utils';
import { CHAMPS_IMPORT, construireTable, proposerRattachement, versLignes } from './import.utils';
import {
  construireModeleImport,
  entetesDuModele,
  FEUILLE_A_REMPLIR,
  FEUILLE_EXEMPLE,
  lignesExempleDuModele,
} from './modele.utils';

/**
 * Ce que ce banc protège.
 *
 * <p>Le modèle n'a d'intérêt que si un fichier rempli à partir de lui arrive à l'écran
 * DÉJÀ rattaché. Ses en-têtes ne sont donc pas un libellé qu'on ajuste : ce sont les
 * chaînes que {@link proposerRattachement} reconnaît. Renommer « Téléphone » en
 * « Contact du client » pour faire plus clair casserait la reconnaissance sans aucune
 * erreur nulle part — la colonne repartirait simplement en « Aucune », et l'opérateur
 * chercherait la panne dans son fichier.</p>
 */
describe('le modèle d’import', () => {
  it('porte une en-tête par champ, toutes distinctes', () => {
    const entetes = entetesDuModele();
    expect(entetes).toHaveLength(CHAMPS_IMPORT.length);
    expect(new Set(entetes).size).toBe(entetes.length);
    expect(entetes.every((e) => e.trim() !== '')).toBe(true);
  });

  it('est reconnu en entier : les huit champs se rattachent sans un geste', () => {
    const table = construireTable([entetesDuModele(), ...lignesExempleDuModele()]);
    const propose = proposerRattachement(table.colonnes);

    for (const champ of CHAMPS_IMPORT) {
      expect(propose[champ], `le champ « ${champ} » n’est pas reconnu`).toBeDefined();
    }
    // Et chaque colonne sert UNE fois : deux champs sur la même colonne écriraient
    // deux fois la même valeur.
    const prises = Object.values(propose);
    expect(new Set(prises).size).toBe(prises.length);
  });

  it('rattache chaque colonne au champ que son en-tête annonce', () => {
    const table = construireTable([entetesDuModele(), ...lignesExempleDuModele()]);
    const propose = proposerRattachement(table.colonnes);
    const nomDe = (champ: keyof typeof propose) =>
      table.colonnes.find((c) => c.id === propose[champ])?.nom;

    expect(nomDe('contact')).toBe('Téléphone');
    expect(nomDe('nom')).toBe('Nom');
    expect(nomDe('prenom')).toBe('Prénoms');
    expect(nomDe('numCheck')).toBe('N° Check');
    expect(nomDe('numCommande')).toBe('N° Commande');
    expect(nomDe('montant')).toBe('Montant');
    expect(nomDe('dateCommande')).toBe('Date');
    expect(nomDe('zoneSaisie')).toBe('Quartier');
  });

  it('ne perd aucune ligne d’exemple : elles ont toutes un contact', () => {
    const table = construireTable([entetesDuModele(), ...lignesExempleDuModele()]);
    const { ecartees, lignes } = versLignes(table, proposerRattachement(table.colonnes));

    expect(ecartees).toBe(0);
    expect(lignes).toHaveLength(lignesExempleDuModele().length);
    expect(lignes[0]?.nom).toBe('KOUASSI');
    expect(lignes[1]?.zoneSaisie).toBe('Marcory Zone 4');
  });

  /*
   * L'exemple ENSEIGNE la forme acceptée. S'il montrait un montant que la saisie
   * refuse, il apprendrait à mal remplir — et le refus tomberait deux cents lignes
   * plus tard, sur un fichier entier.
   */
  it('montre des montants que la saisie sait lire', () => {
    const table = construireTable([entetesDuModele(), ...lignesExempleDuModele()]);
    const { lignes } = versLignes(table, proposerRattachement(table.colonnes));

    expect(analyserMontant(lignes[0]?.montant ?? '')).toBe(12500);
    expect(analyserMontant(lignes[1]?.montant ?? '')).toBe(7250);
  });

  /*
   * Le classeur est relu APRÈS fabrication, pas seulement construit.
   *
   * ⚠ C'est la seule façon de voir que la feuille de travail est bien vide : une
   * inversion des deux feuilles passerait tous les bancs précédents, et livrerait un
   * modèle dont la première feuille porte deux faux clients — qui entreraient en base
   * le jour où quelqu'un tape ses lignes en dessous.
   */
  it('livre une feuille de travail VIDE, et les exemples dans la seconde', async () => {
    const { read, utils } = await import('xlsx');
    const classeur = read(await (await construireModeleImport()).arrayBuffer(), {
      type: 'array',
    });

    // L'ordre compte : le lecteur ouvre SheetNames[0].
    expect(classeur.SheetNames[0]).toBe(FEUILLE_A_REMPLIR);
    expect(classeur.SheetNames).toContain(FEUILLE_EXEMPLE);

    const aRemplir = utils.sheet_to_json<string[]>(classeur.Sheets[FEUILLE_A_REMPLIR], {
      blankrows: false,
      defval: '',
      header: 1,
      raw: false,
    });
    expect(aRemplir).toHaveLength(1);
    expect(aRemplir[0]).toEqual(entetesDuModele());

    const exemple = utils.sheet_to_json<string[]>(classeur.Sheets[FEUILLE_EXEMPLE], {
      blankrows: false,
      defval: '',
      header: 1,
      raw: false,
    });
    expect(exemple[0]).toEqual(entetesDuModele());
    expect(exemple[1]?.[0]).toBe(lignesExempleDuModele()[0]?.[0]);
  });
});
