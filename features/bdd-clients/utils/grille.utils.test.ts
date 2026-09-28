import { describe, expect, it } from 'vitest';

import { analyserCollage, analyserMontant } from './grille.utils';

/**
 * L'analyseur de collage, et celui des montants.
 *
 * <h3>Pourquoi ce banc existe</h3>
 * <p>C'est ici qu'un défaut coûte le plus cher : un ticket de caisse mal lu entre en base
 * mal lu, et plus rien après ne peut le rattraper. Le défaut le plus grave trouvé sur ce
 * module était de cette nature — un point décimal pris pour un séparateur de milliers,
 * qui enregistrait 12 500 en 12,5. Aucun outil ne l'aurait signalé : les deux sont des
 * nombres valides.</p>
 *
 * <p>Ce fichier est le PREMIER test automatisé de cet ERP. Tout ce qui précède reposait
 * sur une relecture humaine.</p>
 */

describe('analyserMontant', () => {
  it('lit un montant simple', () => {
    expect(analyserMontant('21500')).toBe(21500);
  });

  /**
   * ⚠ LE DÉFAUT QUI A COÛTÉ LE PLUS CHER. Un point décimal lu comme un séparateur de
   * milliers transformait un ticket de 12 500 en 12,5, et rien après ne le rattrapait.
   */
  it('traite le point comme un séparateur de milliers, jamais comme une décimale', () => {
    expect(analyserMontant('12.500')).toBe(12500);
    expect(analyserMontant('1.284.000')).toBe(1284000);
  });

  it('accepte la virgule comme décimale, une seule fois', () => {
    expect(analyserMontant('12500,50')).toBe(12500.5);
    // Deux virgules ne veulent rien dire : on refuse plutôt que de deviner.
    expect(analyserMontant('12,500,50')).toBeNull();
  });

  /*
   * ⚠ Les espaces sont écrites en ÉCHAPPEMENT, pas collées telles quelles.
   *
   * Une espace insécable dans un fichier source est invisible à la relecture : on ne
   * distingue pas ce cas du précédent, et un « correctif » de mise en forme peut la
   * remplacer par une espace ordinaire sans que personne ne le voie.
   */
  it('ignore les espaces, y compris insécables et fines', () => {
    expect(analyserMontant('21 500')).toBe(21500);
    expect(analyserMontant('21\u00A0500')).toBe(21500);
    expect(analyserMontant('21\u202F500')).toBe(21500);
    expect(analyserMontant('21\u2009500')).toBe(21500);
  });

  it('retire ce qui traîne autour du nombre', () => {
    expect(analyserMontant('21 500 FCFA')).toBe(21500);
    expect(analyserMontant('F 21500')).toBe(21500);
  });

  it('refuse un montant négatif : une commande ne se paie pas à l’envers', () => {
    expect(analyserMontant('-500')).toBeNull();
  });

  it('rend nul sur une saisie vide ou illisible', () => {
    expect(analyserMontant('')).toBeNull();
    expect(analyserMontant('   ')).toBeNull();
    expect(analyserMontant(null)).toBeNull();
    expect(analyserMontant(undefined)).toBeNull();
    expect(analyserMontant('abc')).toBeNull();
  });

  it('accepte zéro : un ticket offert est un ticket', () => {
    expect(analyserMontant('0')).toBe(0);
  });
});

describe('analyserCollage', () => {
  it('découpe des colonnes séparées par des tabulations', () => {
    expect(analyserCollage('0709444401\tKOFFI\t21500')).toEqual([
      ['0709444401', 'KOFFI', '21500'],
    ]);
  });

  it('découpe plusieurs lignes, en LF comme en CRLF', () => {
    expect(analyserCollage('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    // Excel sous Windows colle du CRLF : une ligne sur deux serait vide sans cela.
    expect(analyserCollage('a\tb\r\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('respecte les guillemets, y compris une tabulation à l’intérieur', () => {
    expect(analyserCollage('"KOFFI\tABOU"\t21500')).toEqual([['KOFFI\tABOU', '21500']]);
  });

  it('rend un guillemet doublé comme un seul', () => {
    expect(analyserCollage('"le ""grand"" KOFFI"\t1')).toEqual([['le "grand" KOFFI', '1']]);
  });

  it('garde les cellules vides : une colonne sautée décale tout le reste', () => {
    expect(analyserCollage('a\t\tc')).toEqual([['a', '', 'c']]);
  });

  it('ignore une ligne vide en fin de collage', () => {
    // Un collage depuis Excel finit presque toujours par un saut de ligne.
    expect(analyserCollage('a\tb\n')).toEqual([['a', 'b']]);
  });

  it('rend une liste vide sur une chaîne vide', () => {
    expect(analyserCollage('')).toEqual([]);
  });
});
