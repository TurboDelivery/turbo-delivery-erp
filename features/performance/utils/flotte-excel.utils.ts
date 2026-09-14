import * as XLSX from 'xlsx';

import type { LignePaieLivreur } from '@/src/performance/fiche-livreur.action';

/*
 * Des codes de format EXCEL, pas du texte français : la virgule y DÉSIGNE le séparateur de
 * milliers, que le tableur remplace par celui de la machine du lecteur. Une espace écrite en
 * dur à cette place donne un format que le tableur ignore, et la colonne retombe en nombres
 * nus.
 */
const FCFA = '#,##0" FCFA"';
const ENTIER = '#,##0';
const POURCENT = '0.0" %"';
const HEURE = 'hh:mm';
const JOUR = 'dd/mm/yyyy';

/** Une ligne de la liste, telle que l'écran la montre. */
export interface LigneFlotteExport {
  nomComplet: string;
  nbTickets: number;
  commission: number;
  prime: number;
  performance: number;
  /** Nombre de jours programmés. Nul quand aucun emploi du temps n'existe. */
  joursProgrammes: number | null;
}

function poserFormat(feuille: XLSX.WorkSheet, colonne: number, premiere: number, derniere: number, format: string) {
  for (let ligne = premiere; ligne <= derniere; ligne += 1) {
    const cellule = feuille[XLSX.utils.encode_cell({ c: colonne, r: ligne })];
    if (cellule && typeof cellule.v === 'number') cellule.z = format;
  }
}

function ecrire(classeur: XLSX.WorkBook, nom: string): void {
  const donnees = XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([donnees], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

/**
 * La liste d'une catégorie, en tableur. Exigence 6 : « export Excel et PDF disponible à
 * trois niveaux : liste filtrée, fiche individuelle, classement / stats globales ».
 *
 * <h3>Des NOMBRES, pas des chaînes</h3>
 * <p>Chaque valeur chiffrée écrit sa valeur brute et la mise en forme est portée par le
 * format de cellule. Un montant écrit « 48 300 FCFA » en texte ne se trie pas, ne se somme
 * pas, ne se met pas en graphique : le destinataire devrait le retaper.</p>
 *
 * <h3>Une cellule VIDE quand la grandeur n'existe pas</h3>
 * <p>Un livreur sans emploi du temps n'a pas « zéro jour programmé » : il n'a pas été
 * programmé du tout. Zéro se sommerait avec les autres et ferait mentir toute colonne
 * calculée par le lecteur du fichier.</p>
 */
export function exporterListeFlotteExcel({
  categorie,
  lignes,
  periode,
}: {
  categorie: string;
  lignes: LigneFlotteExport[];
  periode: string;
}): void {
  const classeur = XLSX.utils.book_new();

  const enTete: (string | number | null)[][] = [
    ['PERFORMANCE DE LA FLOTTE'],
    [],
    ['Catégorie', categorie],
    ['Période', periode],
    ['Livreurs', lignes.length],
    [],
  ];

  const titres = ['Livreur', 'Jours programmés', 'Livraisons', 'Commission', 'Prime', 'Performance'];
  const corps = lignes.map((l) => [
    l.nomComplet,
    l.joursProgrammes,
    l.nbTickets,
    l.commission,
    l.prime,
    l.performance,
  ]);

  // Le total ne porte PAS sur la performance : c'est une note sur cent, pas une quantité.
  const total = [
    `Total — ${lignes.length} livreur${lignes.length > 1 ? 's' : ''}`,
    null,
    lignes.reduce((n, l) => n + l.nbTickets, 0),
    lignes.reduce((n, l) => n + l.commission, 0),
    lignes.reduce((n, l) => n + l.prime, 0),
    null,
  ];

  const tout = [...enTete, titres, ...corps, total];
  const feuille = XLSX.utils.aoa_to_sheet(tout);

  const premiere = enTete.length + 1;
  const derniere = tout.length - 1;
  poserFormat(feuille, 1, premiere, derniere, ENTIER);
  poserFormat(feuille, 2, premiere, derniere, ENTIER);
  poserFormat(feuille, 3, premiere, derniere, FCFA);
  poserFormat(feuille, 4, premiere, derniere, FCFA);
  poserFormat(feuille, 5, premiere, derniere, POURCENT);

  feuille['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 13 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(classeur, feuille, 'Livreurs');

  ecrire(classeur, `performance-flotte-${categorie.toLowerCase()}-${periode.replace(/[^\w-]/g, '')}.xlsx`);
}

/**
 * La fiche d'un livreur, en tableur : ses totaux, puis ses courses une par une.
 *
 * <p>Deux onglets, pour deux usages : le premier se lit, le second se trie et se somme. Les
 * deux viennent de la ligne de paie, donc le total du premier est la somme du second.</p>
 */
export function exporterFicheLivreurExcel({
  ligne,
  periode,
}: {
  ligne: LignePaieLivreur;
  periode: string;
}): void {
  const classeur = XLSX.utils.book_new();

  const fiche: [string, string | number | null][] = [
    ['FICHE DE PERFORMANCE', ''],
    ['', ''],
    ['Livreur', ligne.turboy?.nom ?? ''],
    ['Code Turboy', ligne.turboy?.code ?? ''],
    ['Contrat', ligne.typeLivreur ?? ''],
    ['Période', periode],
    ['', ''],
    ['Livraisons', ligne.tickets],
    ['Frais de livraison générés', ligne.totalFraisLivraison ?? null],
    ['Montant brut', ligne.brut],
    ['Taux appliqué', ligne.taux ?? null],
    ['Bonus', ligne.bonus ?? null],
    ['Prime', ligne.prime ?? null],
    ['Déductions', ligne.deductions ?? null],
    ['Net à payer', ligne.netAPayer],
    ['', ''],
    ['Inclus dans la paie', ligne.inclusDansPaie === false ? 'Non' : 'Oui'],
    ['Motif', ligne.inclusPaieMotif ?? ''],
  ];

  const f1 = XLSX.utils.aoa_to_sheet(fiche);
  const FORMATS: Record<number, string> = {
    7: ENTIER, 8: FCFA, 9: FCFA, 10: POURCENT, 11: FCFA, 12: FCFA, 13: FCFA, 14: FCFA,
  };
  for (const [r, fmt] of Object.entries(FORMATS)) {
    const cellule = f1[XLSX.utils.encode_cell({ c: 1, r: Number(r) })];
    if (cellule && typeof cellule.v === 'number') cellule.z = fmt;
  }
  f1['!cols'] = [{ wch: 30 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(classeur, f1, 'Fiche');

  /*
   * Les courses, une par ligne. La date et l'heure sont SEPAREES : on trie par jour sans
   * perdre l'heure, et on filtre sur un jour sans manipuler des horodatages.
   */
  const courses = ligne.ticketDetails ?? [];
  if (courses.length > 0) {
    const titres = ['Date', 'Heure', 'Référence', 'Partenaire', 'Frais de livraison', 'Commission'];
    const corps = courses.map((t) => {
      const d = new Date(t.date);
      return [d, d, t.ref, t.partenaire, t.fraisLivraison, t.commission];
    });
    const total = [
      null, null, null,
      `Total — ${courses.length} course${courses.length > 1 ? 's' : ''}`,
      courses.reduce((n, t) => n + (t.fraisLivraison ?? 0), 0),
      courses.reduce((n, t) => n + (t.commission ?? 0), 0),
    ];

    const tout = [titres, ...corps, total];
    const f2 = XLSX.utils.aoa_to_sheet(tout, { cellDates: true });
    poserFormat(f2, 0, 1, tout.length - 1, JOUR);
    poserFormat(f2, 1, 1, tout.length - 1, HEURE);
    poserFormat(f2, 4, 1, tout.length - 1, FCFA);
    poserFormat(f2, 5, 1, tout.length - 1, FCFA);
    f2['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(classeur, f2, 'Courses');
  }

  const nom = (ligne.turboy?.nom ?? 'livreur').replace(/[^\w]+/g, '-').toLowerCase();
  ecrire(classeur, `fiche-${nom}-${periode.replace(/[^\w-]/g, '')}.xlsx`);
}
