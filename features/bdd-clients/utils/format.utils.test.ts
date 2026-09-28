import { describe, expect, it } from 'vitest';

import { formatFcfa, formatJour, formatNombre, formatPourcent, nomComplet } from './format.utils';

/**
 * Les formats de la base clients.
 *
 * <h3>Ce que ce banc protège</h3>
 * <p>Deux pièges connus de ce projet. L'année rendue sur quatre chiffres, sans quoi une
 * fiche à l'an 0026 s'affiche « 26 » et passe inaperçue — soixante-huit bons y sont
 * déjà passés. Et l'espace des milliers, qui doit être INSÉCABLE et non l'espace fine
 * insécable que rend `toLocaleString` : cette dernière sort « 20/000 » dans un PDF, et
 * les accents, eux, passent très bien.</p>
 */

/**
 * L'espace insécable attendu, écrit par son point de code.
 *
 * ⚠ Les deux espaces se ressemblent à l'œil et à la relecture : c'est exactement
 * pourquoi ce banc les compare par leur valeur et non de visu. Une assertion écrite
 * avec une espace ordinaire échoue en affichant deux chaînes identiques.
 */
const INSECABLE = '\u00A0';
/** Celle que rend `toLocaleString` et qu'il faut remplacer. */
const FINE_INSECABLE = '\u202F';

describe('formatFcfa', () => {
  it('groupe les milliers avec une espace INSÉCABLE, pas une fine', () => {
    const rendu = formatFcfa(1284000);
    expect(rendu).toBe(`1${INSECABLE}284${INSECABLE}000${INSECABLE}FCFA`);
    // ⚠ La fine insécable sort « 20/000 » dans un PDF.
    expect(rendu).not.toContain(FINE_INSECABLE);
  });

  it('arrondit à l’entier : un franc CFA ne se divise pas', () => {
    expect(formatFcfa(21499.6)).toBe(`21${INSECABLE}500${INSECABLE}FCFA`);
  });

  it('rend un tiret sur une absence, pas « 0 FCFA »', () => {
    expect(formatFcfa(null)).toBe('—');
    expect(formatFcfa(undefined)).toBe('—');
    expect(formatFcfa(Number.NaN)).toBe('—');
    // Zéro est un montant, pas une absence.
    expect(formatFcfa(0)).toBe(`0${INSECABLE}FCFA`);
  });
});

describe('formatNombre', () => {
  it('groupe les milliers sans fine insécable', () => {
    expect(formatNombre(1284)).toBe(`1${INSECABLE}284`);
    expect(formatNombre(1284)).not.toContain(FINE_INSECABLE);
  });

  it('rend un tiret sur une absence, et zéro sur zéro', () => {
    expect(formatNombre(null)).toBe('—');
    expect(formatNombre(0)).toBe('0');
  });
});

describe('formatPourcent', () => {
  it('arrondit à l’entier : la décimale d’un taux est du bruit', () => {
    expect(formatPourcent(0.6234)).toBe(`62${INSECABLE}%`);
    expect(formatPourcent(0.999)).toBe(`100${INSECABLE}%`);
  });

  it('rend un tiret sur une absence, et zéro sur zéro', () => {
    expect(formatPourcent(null)).toBe('—');
    expect(formatPourcent(0)).toBe(`0${INSECABLE}%`);
  });
});

describe('formatJour', () => {
  it('rend jour, mois et année sur deux, deux et QUATRE chiffres', () => {
    expect(formatJour('2026-09-05T10:00:00Z')).toBe('05/09/2026');
  });

  /**
   * ⚠ Le cas des soixante-huit bons à l'an 0026. Une année rendue sans ses zéros de
   * tête affiche « 26 » et ne se distingue pas de 2026 : l'aberration doit SE VOIR.
   */
  it('garde les zéros de tête d’une année aberrante', () => {
    const rendu = formatJour(new Date(Date.UTC(26, 8, 5, 10)).toISOString());
    expect(rendu.split('/')[2]).toHaveLength(4);
  });

  it('rend un tiret sur une date absente ou illisible', () => {
    expect(formatJour(null)).toBe('—');
    expect(formatJour('')).toBe('—');
    expect(formatJour('pas une date')).toBe('—');
  });
});

describe('nomComplet', () => {
  it('rend NOM puis PRÉNOMS, dans l’ordre du serveur', () => {
    expect(nomComplet('KOFFI', 'ABOU')).toBe('KOFFI ABOU');
  });

  it('se contente de ce qu’il a', () => {
    expect(nomComplet('KOFFI', null)).toBe('KOFFI');
    expect(nomComplet(null, 'ABOU')).toBe('ABOU');
  });

  it('rend NUL quand il n’y a rien, pour que l’appelant décide quoi afficher', () => {
    // Une chaîne vide passerait inaperçue au milieu d'une phrase.
    expect(nomComplet(null, null)).toBeNull();
    expect(nomComplet('  ', '')).toBeNull();
  });
});
