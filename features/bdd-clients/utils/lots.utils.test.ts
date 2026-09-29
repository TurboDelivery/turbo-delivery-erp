import { describe, expect, it } from 'vitest';

import { decouper, nombreDeLots } from './lots.utils';

const suite = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('decouper', () => {
  it('coupe en tranches pleines, la dernière plus courte', () => {
    expect(decouper(suite(13), 5).map((t) => t.length)).toEqual([5, 5, 3]);
  });

  it('garde l’ordre et ne perd ni ne duplique une ligne', () => {
    const tranches = decouper(suite(13481), 500);
    expect(tranches).toHaveLength(27);
    expect(tranches.flat()).toEqual(suite(13481));
  });

  it('rend une seule tranche quand le fichier tient dans un lot', () => {
    expect(decouper(suite(50), 50)).toHaveLength(1);
    expect(decouper(suite(49), 50)).toHaveLength(1);
  });

  it('ne rend rien sur une liste vide', () => {
    expect(decouper([], 50)).toEqual([]);
  });

  /*
   * ⚠ Un plafond inconnu ne vaut pas « tout en un lot ».
   *
   * C'est l'état où le serveur n'a pas encore répondu. Rendre une tranche unique ferait
   * partir le fichier entier, et le serveur le refuserait après tout le travail de
   * colonnes : precisement le défaut qu'on répare.
   */
  it('ne rend rien tant que le plafond est inconnu', () => {
    expect(decouper(suite(10), 0)).toEqual([]);
    expect(decouper(suite(10), -1)).toEqual([]);
    expect(decouper(suite(10), Number.NaN)).toEqual([]);
  });
});

describe('nombreDeLots', () => {
  it('arrondit vers le haut : la dernière tranche compte', () => {
    expect(nombreDeLots(13481, 500)).toBe(27);
    expect(nombreDeLots(500, 500)).toBe(1);
    expect(nombreDeLots(501, 500)).toBe(2);
    expect(nombreDeLots(13481, 50)).toBe(270);
  });

  it('rend zéro sur un fichier vide ou un plafond inconnu', () => {
    expect(nombreDeLots(0, 500)).toBe(0);
    expect(nombreDeLots(100, 0)).toBe(0);
  });
});

/*
 * La reprise, telle que l'écran la calcule : il renvoie la QUEUE du fichier, jamais
 * depuis le début. Chaque lot parti est écrit et ne s'annule pas ; rejouer le début
 * recréerait une capture pour chaque client déjà enregistré, et son compteur, son
 * segment et son rang seraient faux.
 */
describe('reprise après un envoi interrompu', () => {
  it('ne renvoie que ce qui n’est pas passé', () => {
    const fichier = suite(13481);
    const ecrites = 3500; // sept lots de 500 sont passés
    const reste = decouper(fichier.slice(ecrites), 500);

    expect(reste.flat()).toEqual(fichier.slice(3500));
    expect(reste.flat()).toHaveLength(13481 - 3500);
    expect(reste[0]?.[0]).toBe(3500);
    expect(nombreDeLots(13481 - 3500, 500)).toBe(reste.length);
  });

  it('résiste à une SECONDE interruption', () => {
    const fichier = suite(13481);
    const apresPremier = 3500;
    const apresSecond = apresPremier + 4 * 500;
    const reste = decouper(fichier.slice(apresSecond), 500);

    expect(reste[0]?.[0]).toBe(5500);
    expect(reste.flat()).toHaveLength(13481 - 5500);
  });

  it('ne renvoie rien quand tout est passé', () => {
    expect(decouper(suite(1000).slice(1000), 500)).toEqual([]);
  });
});
