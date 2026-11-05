import { describe, expect, it } from 'vitest';

import { construireTable } from '@/lib/tableur/atelier-colonnes';
import {
  choixDeZone,
  clefChoixZone,
  normaliserTexte,
  preparerLignes,
  proposerCorrespondances,
  proposerRattachementTicket,
  referencesEnDoublon,
  valeursDistinctes,
  versLignesTicket,
  type ICandidat,
  type ILigneLue,
  type IZoneGrille,
} from './import-tickets.utils';

/** Les en-têtes de l'export de tickets de l'ERP, au mot près. */
const ENTETE_EXPORT_ERP = [
  'Code Check',
  'Livreur',
  'Partner',
  'Montant de Livraison',
  'Montant de Commande',
  'Commission',
  'Date',
  'Heure',
];

/** Les en-têtes de la feuille de suivi du réseau, au mot près. */
const ENTETE_FEUILLE_TERRAIN = [
  'ID',
  'Référence',
  'Livreur',
  'Restaurant',
  'Coût livraison',
  'Coût commande',
  'Date',
  'Heure',
  'Auth',
];

describe('proposerRattachementTicket', () => {
  it("reconnaît l'export de tickets de l'ERP sans intervention", () => {
    const { colonnes } = construireTable([ENTETE_EXPORT_ERP]);
    const rattachement = proposerRattachementTicket(colonnes);

    const nomDe = (id: string | undefined) => colonnes.find((c) => c.id === id)?.nom;
    expect(nomDe(rattachement.reference)).toBe('Code Check');
    expect(nomDe(rattachement.livreur)).toBe('Livreur');
    expect(nomDe(rattachement.partenaire)).toBe('Partner');
    expect(nomDe(rattachement.montantLivraison)).toBe('Montant de Livraison');
    expect(nomDe(rattachement.montantCommande)).toBe('Montant de Commande');
    expect(nomDe(rattachement.date)).toBe('Date');
    expect(nomDe(rattachement.heure)).toBe('Heure');
  });

  it('reconnaît la feuille de suivi du réseau', () => {
    const { colonnes } = construireTable([ENTETE_FEUILLE_TERRAIN]);
    const rattachement = proposerRattachementTicket(colonnes);

    const nomDe = (id: string | undefined) => colonnes.find((c) => c.id === id)?.nom;
    expect(nomDe(rattachement.reference)).toBe('Référence');
    expect(nomDe(rattachement.partenaire)).toBe('Restaurant');
    expect(nomDe(rattachement.montantLivraison)).toBe('Coût livraison');
    expect(nomDe(rattachement.montantCommande)).toBe('Coût commande');
  });

  it('ne rattache aucun champ à la colonne Commission', () => {
    // Le serveur recalcule la commission et jette celle qu'on lui envoie. Une colonne
    // « Commission » captée par « Montant de commande » ferait enregistrer la commission
    // comme panier du client : le chiffre d'affaires du partenaire deviendrait faux.
    const { colonnes } = construireTable([ENTETE_EXPORT_ERP]);
    const rattachement = proposerRattachementTicket(colonnes);
    const colonneCommission = colonnes.find((c) => c.nom === 'Commission');

    expect(Object.values(rattachement)).not.toContain(colonneCommission?.id);
  });

  it('ne confond pas « Livreur » et « Coût livraison »', () => {
    const { colonnes } = construireTable([['Coût livraison', 'Livreur']]);
    const rattachement = proposerRattachementTicket(colonnes);

    expect(rattachement.livreur).toBe(colonnes[1].id);
    expect(rattachement.montantLivraison).toBe(colonnes[0].id);
  });

  it('laisse vide ce qu’il ne reconnaît pas plutôt que de deviner', () => {
    const { colonnes } = construireTable([['Colonne A', 'Colonne B']]);
    expect(proposerRattachementTicket(colonnes)).toEqual({});
  });
});

describe('versLignesTicket', () => {
  const table = construireTable([
    ENTETE_FEUILLE_TERRAIN,
    ['1', '823025', 'KRAH Éric', 'AGHA', '1 000CFA', '12 500CFA', '01/06/2024', '21:45:00'],
    ['2', '822871', 'KRA ÉVARISTE', 'AGHA', '2 500CFA', '6 500CFA', '01/06/2024', '18:03:00'],
  ]);
  const rattachement = proposerRattachementTicket(table.colonnes);

  it('lit les montants avec leur devise et leurs espaces', () => {
    const [premiere] = versLignesTicket(table, rattachement);
    expect(premiere.montantLivraison).toBe(1000);
    expect(premiere.montantCommande).toBe(12500);
  });

  it('lit le jour avant le mois, et garde l’heure sans décalage', () => {
    const [premiere] = versLignesTicket(table, rattachement);
    expect(premiere.date).toBe('2024-06-01');
    expect(premiere.heure).toBe('21:45:00');
  });

  it('numérote les lignes comme le tableur, en-tête comprise', () => {
    const lues = versLignesTicket(table, rattachement);
    expect(lues.map((l) => l.index)).toEqual([2, 3]);
  });

  it('met minuit quand la colonne heure n’est pas rattachée', () => {
    const sansHeure = { ...rattachement, heure: undefined };
    const [premiere] = versLignesTicket(table, sansHeure);
    expect(premiere.date).toBe('2024-06-01');
    expect(premiere.heure).toBe('00:00:00');
  });

  it('rend une date nulle plutôt qu’une date inventée', () => {
    const douteuse = construireTable([
      ENTETE_FEUILLE_TERRAIN,
      ['1', '1', 'X', 'Y', '1000', '2000', '31/02/2024', '10:00:00'],
    ]);
    const [ligne] = versLignesTicket(douteuse, proposerRattachementTicket(douteuse.colonnes));
    expect(ligne.date).toBeNull();
  });
});

describe('normaliserTexte', () => {
  it('rapproche les écritures d’un même nom', () => {
    expect(normaliserTexte("N'DRI JEAN JACQUES")).toBe(normaliserTexte("N'Dri  Jean-Jacques"));
    expect(normaliserTexte('KRAH Éric')).toBe('KRAH ERIC');
  });
});

describe('valeursDistinctes', () => {
  const lignes = [
    { livreur: 'KRAH Éric', partenaire: 'AGHA' },
    { livreur: "N'DRI JEAN JACQUES", partenaire: 'AGHA' },
    { livreur: 'KRAH Eric', partenaire: 'AGHA' },
    { livreur: '', partenaire: 'AGHA' },
  ].map((l, i) => ({ ...l, index: i + 2 }) as ILigneLue);

  it('regroupe les écritures d’un même nom et compte les lignes', () => {
    const valeurs = valeursDistinctes(lignes, 'livreur');
    expect(valeurs).toHaveLength(2);
    expect(valeurs[0]).toMatchObject({ normalisee: 'KRAH ERIC', occurrences: 2 });
  });

  it('écarte les cellules vides', () => {
    expect(valeursDistinctes(lignes, 'livreur').map((v) => v.normalisee)).not.toContain('');
  });
});

describe('proposerCorrespondances', () => {
  const candidats: ICandidat[] = [
    { id: 'l1', libelles: ['KRAH Éric', 'Éric KRAH'] },
    { id: 'l2', libelles: ['SIDY MOHAMED', 'MOHAMED SIDY'] },
    { id: 'l3', libelles: ['KOUAME Yao', 'Yao KOUAME'] },
    { id: 'l4', libelles: ['KOUAME Yaya', 'Yaya KOUAME'] },
  ];

  it('rattache un nom qui ne désigne qu’un seul livreur', () => {
    const valeurs = valeursDistinctes(
      [{ index: 2, livreur: 'KRAH ERIC' }] as ILigneLue[],
      'livreur',
    );
    expect(proposerCorrespondances(valeurs, candidats)).toEqual({ 'KRAH ERIC': 'l1' });
  });

  it('accepte l’ordre inversé prénom / nom', () => {
    const valeurs = valeursDistinctes(
      [{ index: 2, livreur: 'MOHAMED SIDY' }] as ILigneLue[],
      'livreur',
    );
    expect(proposerCorrespondances(valeurs, candidats)).toEqual({ 'MOHAMED SIDY': 'l2' });
  });

  it('ne propose RIEN quand deux livreurs portent la même écriture', () => {
    const homonymes: ICandidat[] = [
      { id: 'a', libelles: ['TOURE Ali'] },
      { id: 'b', libelles: ['TOURE Ali'] },
    ];
    const valeurs = valeursDistinctes([{ index: 2, livreur: 'TOURE Ali' }] as ILigneLue[], 'livreur');
    expect(proposerCorrespondances(valeurs, homonymes)).toEqual({});
  });

  it('ne rapproche pas deux noms voisins', () => {
    const valeurs = valeursDistinctes([{ index: 2, livreur: 'KOUAME Yao' }] as ILigneLue[], 'livreur');
    expect(proposerCorrespondances(valeurs, candidats)).toEqual({ 'KOUAME YAO': 'l3' });
  });
});

describe('choixDeZone', () => {
  const grilles: Record<string, IZoneGrille[]> = {
    r1: [
      { commission: 200, id: 'z1', nom: 'ZONE 4', prix: 1000 },
      { commission: 200, id: 'z2', nom: 'BIETRY', prix: 1000 },
      { commission: 500, id: 'z3', nom: 'AÉROPORT', prix: 2500 },
      { commission: 900, id: 'z4', nom: 'VRIDI', prix: 2500 },
    ],
  };
  const lignes = [
    { index: 2, montantLivraison: 1000, partenaire: 'AGHA' },
    { index: 3, montantLivraison: 1000, partenaire: 'AGHA' },
    { index: 4, montantLivraison: 2500, partenaire: 'AGHA' },
  ] as ILigneLue[];
  const correspondance = { AGHA: 'r1' };

  it('pose une question par couple (partenaire, prix), pas par ligne', () => {
    const choix = choixDeZone(lignes, correspondance, grilles);
    expect(choix).toHaveLength(2);
    expect(choix[0]).toMatchObject({ occurrences: 2, prix: 1000 });
  });

  it('dit quand le choix ne change pas le montant', () => {
    const choix = choixDeZone(lignes, correspondance, grilles);
    expect(choix.find((c) => c.prix === 1000)?.sansEffetSurLeMontant).toBe(true);
  });

  it('dit quand le choix déplace de l’argent', () => {
    const choix = choixDeZone(lignes, correspondance, grilles);
    expect(choix.find((c) => c.prix === 2500)?.sansEffetSurLeMontant).toBe(false);
  });

  it('rend le couple même sans aucune zone candidate', () => {
    const orphelin = [{ index: 2, montantLivraison: 7777, partenaire: 'AGHA' }] as ILigneLue[];
    const [choix] = choixDeZone(orphelin, correspondance, grilles);
    expect(choix.candidates).toEqual([]);
  });

  it('ignore une ligne dont le partenaire n’est pas rattaché', () => {
    expect(choixDeZone(lignes, {}, grilles)).toEqual([]);
  });
});

describe('preparerLignes', () => {
  const base: ILigneLue = {
    date: '2024-06-01',
    heure: '21:45:00',
    index: 2,
    livreur: 'KRAH Éric',
    montantCommande: 12500,
    montantLivraison: 1000,
    partenaire: 'AGHA',
    reference: '823025',
  };
  const livreurs = { 'KRAH ERIC': 'l1' };
  const partenaires = { AGHA: 'r1' };
  const zones = { [clefChoixZone('r1', 1000)]: 'z1' };

  it('assemble une ligne complète', () => {
    const { pretes, incompletes } = preparerLignes([base], livreurs, partenaires, zones);
    expect(incompletes).toEqual([]);
    expect(pretes[0]).toEqual({
      date: '2024-06-01',
      heure: '21:45:00',
      index: 2,
      livreurId: 'l1',
      montantCommande: 12500,
      montantLivraison: 1000,
      reference: '823025',
      restaurantId: 'r1',
      zoneId: 'z1',
    });
  });

  it('écarte la ligne dont le livreur n’est pas rattaché, en le nommant', () => {
    const { pretes, incompletes } = preparerLignes(
      [{ ...base, livreur: 'INCONNU Jean' }],
      livreurs,
      partenaires,
      zones,
    );
    expect(pretes).toEqual([]);
    expect(incompletes[0].motif).toContain('INCONNU Jean');
  });

  it('écarte la ligne dont aucune zone n’a été choisie', () => {
    const { incompletes } = preparerLignes([base], livreurs, partenaires, {});
    expect(incompletes[0].motif).toContain('1000');
  });

  it('remplace une heure absente par minuit, sans écarter la ligne', () => {
    const { pretes } = preparerLignes(
      [{ ...base, heure: null }],
      livreurs,
      partenaires,
      zones,
    );
    expect(pretes[0].heure).toBe('00:00:00');
  });

  it('écarte une date illisible', () => {
    const { pretes, incompletes } = preparerLignes(
      [{ ...base, date: null }],
      livreurs,
      partenaires,
      zones,
    );
    expect(pretes).toEqual([]);
    expect(incompletes[0].motif).toBe('Date illisible.');
  });
});

describe('referencesEnDoublon', () => {
  it('trouve deux lignes du même fichier qui portent la même référence', () => {
    const lignes = [
      { index: 2, reference: '823025' },
      { index: 3, reference: '822863' },
      { index: 9, reference: ' 823025 ' },
    ] as ILigneLue[];

    const doublons = referencesEnDoublon(lignes);
    expect([...doublons.keys()]).toEqual(['823025']);
    expect(doublons.get('823025')).toEqual([2, 9]);
  });

  it('ne signale rien sur un fichier sain', () => {
    const lignes = [
      { index: 2, reference: 'A' },
      { index: 3, reference: 'B' },
    ] as ILigneLue[];
    expect(referencesEnDoublon(lignes).size).toBe(0);
  });
});
