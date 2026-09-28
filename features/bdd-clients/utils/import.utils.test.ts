import { describe, expect, it } from 'vitest';

import {
  appliquer,
  construireTable,
  nettoyer,
  proposerRattachement,
  versLignes,
  type ITransformation,
} from './import.utils';

/**
 * Le moteur de transformation de l'import.
 *
 * <h3>Ce que ce banc protège</h3>
 * <p>Trois propriétés. Les colonnes sont désignées par un IDENTIFIANT, pas par une
 * position — sinon supprimer une colonne rendrait fausses toutes les transformations
 * suivantes, en silence. Les transformations se rejouent depuis la source, donc défaire
 * c'est retirer un élément de la liste. Et une transformation qui désigne une colonne
 * disparue est ignorée, pas fatale.</p>
 */

/** Une table minuscule, telle qu'un fichier de caisse la donnerait. */
function table() {
  return construireTable([
    ['Téléphone client', 'Nom complet', 'Total TTC', 'N° Ticket'],
    ['07 09 44 44 01', 'KOFFI ABOU', '21 500 F', '111025'],
    ['05 01 02 03 04', "N'DRI YAO", '16 000 F', '111026'],
  ]);
}

const idDe = (t: ReturnType<typeof table>, nom: string) =>
  t.colonnes.find((c) => c.nom === nom)!.id;

describe('construireTable', () => {
  it('prend la première ligne comme en-tête', () => {
    const t = table();
    expect(t.colonnes.map((c) => c.nom)).toEqual([
      'Téléphone client',
      'Nom complet',
      'Total TTC',
      'N° Ticket',
    ]);
    expect(t.lignes).toHaveLength(2);
  });

  /**
   * ⚠ Une colonne anonyme peut très bien être celle qui porte les numéros : la faire
   * disparaître au chargement serait une perte silencieuse.
   */
  it('nomme une colonne sans en-tête au lieu de l’écarter', () => {
    const t = construireTable([['Tel', '', 'Montant'], ['07', 'x', '1']]);
    expect(t.colonnes.map((c) => c.nom)).toEqual(['Tel', 'Colonne 2', 'Montant']);
    expect(t.lignes[0][t.colonnes[1].id]).toBe('x');
  });

  it('suffixe un en-tête en double, sinon on ne sait plus laquelle on rattache', () => {
    const t = construireTable([['Nom', 'Nom'], ['a', 'b']]);
    expect(t.colonnes.map((c) => c.nom)).toEqual(['Nom', 'Nom (2)']);
  });

  it('complète les lignes plus courtes que l’en-tête', () => {
    const t = construireTable([['a', 'b', 'c'], ['1']]);
    expect(t.lignes[0][t.colonnes[2].id]).toBe('');
  });

  it('rend une table vide sur une grille vide', () => {
    expect(construireTable([])).toEqual({ colonnes: [], lignes: [] });
  });
});

describe('nettoyer', () => {
  it('retire les espaces en trop, y compris insécables et fines', () => {
    expect(nettoyer('  KOFFI   ABOU  ', 'espaces')).toBe('KOFFI ABOU');
  });

  it('ne garde que les chiffres', () => {
    expect(nettoyer('+225 07 09 44 44 01', 'chiffres')).toBe('2250709444401');
  });

  it('met une capitale à chaque mot, y compris après une apostrophe', () => {
    expect(nettoyer("n'dri yao-koffi", 'capitales')).toBe("N'Dri Yao-Koffi");
  });

  it('retire les accents sans toucher aux lettres', () => {
    expect(nettoyer('Créüs Ângré', 'sansAccents')).toBe('Creus Angre');
  });

  it('passe en majuscules et en minuscules', () => {
    expect(nettoyer('KoFFi', 'majuscules')).toBe('KOFFI');
    expect(nettoyer('KoFFi', 'minuscules')).toBe('koffi');
  });
});

describe('appliquer', () => {
  it('fusionne deux colonnes en une nouvelle, sans toucher aux sources', () => {
    const t = table();
    const transformations: ITransformation[] = [
      {
        id: 'fusion',
        nom: 'Identité',
        separateur: ' — ',
        sources: [idDe(t, 'Nom complet'), idDe(t, 'N° Ticket')],
        type: 'fusionner',
      },
    ];
    const resultat = appliquer(t, transformations);

    expect(resultat.colonnes).toHaveLength(5);
    expect(resultat.lignes[0].fusion).toBe('KOFFI ABOU — 111025');
    // La source est intacte : c'est ce qui rend « défaire » gratuit.
    expect(resultat.lignes[0][idDe(t, 'Nom complet')]).toBe('KOFFI ABOU');
  });

  it('ignore les valeurs vides dans une fusion, sans laisser le séparateur', () => {
    const t = construireTable([['a', 'b'], ['KOFFI', '']]);
    const resultat = appliquer(t, [
      {
        id: 'f',
        nom: 'Tout',
        separateur: ' ',
        sources: [t.colonnes[0].id, t.colonnes[1].id],
        type: 'fusionner',
      },
    ]);
    expect(resultat.lignes[0].f).toBe('KOFFI');
  });

  it('divise une colonne en deux à la PREMIÈRE occurrence du séparateur', () => {
    const t = table();
    const resultat = appliquer(t, [
      {
        idDroite: 'd',
        idGauche: 'g',
        nomDroite: 'Prénoms',
        nomGauche: 'Nom',
        separateur: ' ',
        source: idDe(t, 'Nom complet'),
        type: 'diviser',
      },
    ]);
    expect(resultat.lignes[0].g).toBe('KOFFI');
    expect(resultat.lignes[0].d).toBe('ABOU');
  });

  it('met tout à gauche quand le séparateur est absent', () => {
    const t = construireTable([['n'], ['KOFFI']]);
    const resultat = appliquer(t, [
      {
        idDroite: 'd',
        idGauche: 'g',
        nomDroite: 'Droite',
        nomGauche: 'Gauche',
        separateur: ',',
        source: t.colonnes[0].id,
        type: 'diviser',
      },
    ]);
    expect(resultat.lignes[0].g).toBe('KOFFI');
    expect(resultat.lignes[0].d).toBe('');
  });

  /**
   * Un séparateur vide découperait entre chaque caractère : la colonne de droite
   * recevrait tout sauf la première lettre, ce que personne ne demande jamais.
   */
  it('ne coupe pas sur un séparateur vide', () => {
    const t = construireTable([['n'], ['KOFFI']]);
    const resultat = appliquer(t, [
      {
        idDroite: 'd',
        idGauche: 'g',
        nomDroite: 'Droite',
        nomGauche: 'Gauche',
        separateur: '',
        source: t.colonnes[0].id,
        type: 'diviser',
      },
    ]);
    expect(resultat.lignes[0].g).toBe('KOFFI');
    expect(resultat.lignes[0].d).toBe('');
  });

  it('nettoie une colonne EN PLACE : c’est une correction, pas un ajout', () => {
    const t = table();
    const id = idDe(t, 'Total TTC');
    const resultat = appliquer(t, [{ nettoyage: 'chiffres', source: id, type: 'nettoyer' }]);
    expect(resultat.colonnes).toHaveLength(4);
    expect(resultat.lignes[0][id]).toBe('21500');
  });

  it('supprime et renomme une colonne', () => {
    const t = table();
    const resultat = appliquer(t, [
      { source: idDe(t, 'N° Ticket'), type: 'supprimer' },
      { nom: 'Contact', source: idDe(t, 'Téléphone client'), type: 'renommer' },
    ]);
    expect(resultat.colonnes.map((c) => c.nom)).toEqual([
      'Contact',
      'Nom complet',
      'Total TTC',
    ]);
  });

  /**
   * ⚠ La propriété qui tient tout le reste. Avec des positions, supprimer une colonne
   * aurait décalé toutes les transformations suivantes, en silence.
   */
  it('supprimer une colonne ne décale PAS les transformations suivantes', () => {
    const t = table();
    const resultat = appliquer(t, [
      { source: idDe(t, 'Téléphone client'), type: 'supprimer' },
      { nettoyage: 'chiffres', source: idDe(t, 'Total TTC'), type: 'nettoyer' },
    ]);
    expect(resultat.lignes[0][idDe(t, 'Total TTC')]).toBe('21500');
  });

  it('ignore une transformation qui désigne une colonne disparue, sans tomber', () => {
    const t = table();
    const id = idDe(t, 'N° Ticket');
    const resultat = appliquer(t, [
      { source: id, type: 'supprimer' },
      { nettoyage: 'majuscules', source: id, type: 'nettoyer' },
      {
        id: 'f',
        nom: 'X',
        separateur: '-',
        sources: [id, idDe(t, 'Nom complet')],
        type: 'fusionner',
      },
    ]);
    expect(resultat.colonnes.map((c) => c.nom)).not.toContain('X');
    expect(resultat.lignes).toHaveLength(2);
  });

  it('rejouer la même liste donne le même résultat', () => {
    const t = table();
    const liste: ITransformation[] = [
      { nettoyage: 'chiffres', source: idDe(t, 'Total TTC'), type: 'nettoyer' },
    ];
    expect(appliquer(t, liste)).toEqual(appliquer(t, liste));
  });
});

describe('filtrer les lignes', () => {
  function avecStatut() {
    return construireTable([
      ['Tel', 'Statut'],
      ['0709444401', 'Payé'],
      ['0501020304', 'ANNULE'],
      ['2720101010', 'payé'],
      ['0188776655', ''],
    ]);
  }

  /**
   * ⚠ La casse et les espaces de bord sont ignorés : un fichier de caisse écrit
   * « Annulé », « ANNULE » et « annulé  » pour la même chose.
   */
  it('retire les lignes qui correspondent, sans regarder la casse', () => {
    const t = avecStatut();
    const resultat = appliquer(t, [
      {
        comparaison: 'contient',
        garder: false,
        source: t.colonnes[1].id,
        type: 'filtrer',
        valeur: 'annule',
      },
    ]);
    expect(resultat.lignes).toHaveLength(3);
  });

  it('garde les lignes qui correspondent', () => {
    const t = avecStatut();
    const resultat = appliquer(t, [
      {
        comparaison: 'egal',
        garder: true,
        source: t.colonnes[1].id,
        type: 'filtrer',
        valeur: 'payé',
      },
    ]);
    expect(resultat.lignes).toHaveLength(2);
  });

  it('sait retenir ou écarter les cases vides', () => {
    const t = avecStatut();
    const vides = appliquer(t, [
      { comparaison: 'vide', garder: true, source: t.colonnes[1].id, type: 'filtrer', valeur: '' },
    ]);
    expect(vides.lignes).toHaveLength(1);

    const remplies = appliquer(t, [
      {
        comparaison: 'nonVide',
        garder: true,
        source: t.colonnes[1].id,
        type: 'filtrer',
        valeur: '',
      },
    ]);
    expect(remplies.lignes).toHaveLength(3);
  });

  /**
   * Une valeur de comparaison vide ne correspond à RIEN : sinon « contient vide »
   * garderait ou retirerait tout le fichier d'un geste, sans qu'on l'ait demandé.
   */
  it('une valeur vide ne fait correspondre aucune ligne', () => {
    const t = avecStatut();
    const resultat = appliquer(t, [
      { comparaison: 'contient', garder: false, source: t.colonnes[1].id, type: 'filtrer', valeur: '' },
    ]);
    expect(resultat.lignes).toHaveLength(4);
  });

  it('un filtre sur une colonne disparue est ignoré', () => {
    const t = avecStatut();
    const id = t.colonnes[1].id;
    const resultat = appliquer(t, [
      { source: id, type: 'supprimer' },
      { comparaison: 'vide', garder: false, source: id, type: 'filtrer', valeur: '' },
    ]);
    expect(resultat.lignes).toHaveLength(4);
  });
});

describe('proposerRattachement', () => {
  it('reconnaît les colonnes usuelles d’un fichier de caisse', () => {
    const t = table();
    const propose = proposerRattachement(t.colonnes);
    expect(propose.contact).toBe(idDe(t, 'Téléphone client'));
    expect(propose.montant).toBe(idDe(t, 'Total TTC'));
    expect(propose.numCheck).toBe(idDe(t, 'N° Ticket'));
  });

  it('ne rattache pas deux champs à la même colonne', () => {
    const t = construireTable([['Nom du client'], ['x']]);
    const propose = proposerRattachement(t.colonnes);
    const utilisees = Object.values(propose);
    expect(new Set(utilisees).size).toBe(utilisees.length);
  });

  it('ne propose rien quand rien ne ressemble', () => {
    const t = construireTable([['aaa', 'bbb'], ['1', '2']]);
    expect(proposerRattachement(t.colonnes)).toEqual({});
  });
});

describe('versLignes', () => {
  it('rend les lignes prêtes pour la grille de saisie', () => {
    const t = table();
    const { ecartees, lignes } = versLignes(t, {
      contact: idDe(t, 'Téléphone client'),
      montant: idDe(t, 'Total TTC'),
      nom: idDe(t, 'Nom complet'),
      numCheck: idDe(t, 'N° Ticket'),
    });
    expect(ecartees).toBe(0);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toMatchObject({
      contact: '07 09 44 44 01',
      montant: '21 500 F',
      nom: 'KOFFI ABOU',
      numCheck: '111025',
    });
    // Un champ non rattaché sort vide, jamais indéfini : la grille attend des chaînes.
    expect(lignes[0].prenom).toBe('');
  });

  /**
   * ⚠ Un fichier de caisse finit presque toujours par une ligne de total. Sans numéro,
   * ce n'est pas un client : la laisser passer ferait un refus incompréhensible au
   * contrôle, sur une ligne que l'opérateur n'a pas saisie.
   */
  it('écarte une ligne sans numéro, et le COMPTE', () => {
    const t = construireTable([
      ['Tel', 'Montant'],
      ['0709444401', '100'],
      ['', 'TOTAL 100'],
    ]);
    const { ecartees, lignes } = versLignes(t, {
      contact: t.colonnes[0].id,
      montant: t.colonnes[1].id,
    });
    expect(lignes).toHaveLength(1);
    expect(ecartees).toBe(1);
  });

  it('ne compte pas une ligne entièrement vide comme écartée', () => {
    const t = construireTable([['Tel', 'Montant'], ['', '']]);
    const { ecartees, lignes } = versLignes(t, { contact: t.colonnes[0].id });
    expect(lignes).toHaveLength(0);
    expect(ecartees).toBe(0);
  });

  it('sans rattachement du contact, tout est écarté', () => {
    const t = table();
    const { ecartees, lignes } = versLignes(t, { nom: idDe(t, 'Nom complet') });
    expect(lignes).toHaveLength(0);
    expect(ecartees).toBe(2);
  });
});
