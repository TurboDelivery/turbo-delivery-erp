'use client';
import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IFactureDetail } from '@/features/recouvrements/types/facture.types';

type LigneFacture = {
  date: Date;
  nombreLivraison: number;
  montantLivraison: number;
  montantCommandes: number;
  totalCommission: number;
};

type Facture = {
  numero?: string;
  client: string;
  dateFacture: Date;
  periode: {
    debut: Date;
    fin: Date;
  };
  cyclePaiement: 'journalier' | 'hebdomadaire';
  lignes: LigneFacture[];
  totaux: {
    montantLivraison: number;
    montantCommandes: number;
    montantCommissions: number;
    factureAPayer: number;
  };
};

interface FacturePdfProps {
  factureDetail: IFactureDetail;
}


export const facture: Facture = {
  numero: 'FAC-2025-02-02',
  client: 'VILLA DI SORENTO',
  dateFacture: new Date(2025, 1, 2), // 02 février 2025 (mois commence à 0)

  periode: {
    debut: new Date(2025, 0, 11),
    fin: new Date(2025, 0, 17),
  },

  cyclePaiement: 'hebdomadaire',

  lignes: [
    {
      date: new Date(2025, 0, 11),
      nombreLivraison: 11,
      montantLivraison: 11000,
      montantCommandes: 107000,
      totalCommission: 3300,
    },
    {
      date: new Date(2025, 0, 12),
      nombreLivraison: 17,
      montantLivraison: 17000,
      montantCommandes: 205500,
      totalCommission: 5500,
    },
    {
      date: new Date(2025, 0, 13),
      nombreLivraison: 23,
      montantLivraison: 23000,
      montantCommandes: 221000,
      totalCommission: 6900,
    },
    {
      date: new Date(2025, 0, 14),
      nombreLivraison: 23,
      montantLivraison: 23000,
      montantCommandes: 107000,
      totalCommission: 6900,
    },
    {
      date: new Date(2025, 0, 15),
      nombreLivraison: 23,
      montantLivraison: 23000,
      montantCommandes: 107000,
      totalCommission: 6900,
    },
    {
      date: new Date(2025, 0, 16),
      nombreLivraison: 23,
      montantLivraison: 23000,
      montantCommandes: 107000,
      totalCommission: 6900,
    },
    {
      date: new Date(2025, 0, 17),
      nombreLivraison: 23,
      montantLivraison: 23000,
      montantCommandes: 107000,
      totalCommission: 6900,
    },
  ],

  totaux: {
    montantLivraison: 143000,
    montantCommandes: 961000,
    montantCommissions: 43300,
    factureAPayer: 437050,
  },
};

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111',
  },
  container: {
    padding: 20,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FE3A31',
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  periodBox: {
    marginVertical: 15,
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 4,
    width: '200px',
  },
  periodText: {
    fontSize: 12,
    color: '#111',
    fontWeight: 'semibold',
  },
  periodDate: {
    fontSize: 12,
    color: '#333',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingBottom: 4,
    marginTop: 10,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: '1px solid #eee',
  },
  colDate: { width: '15%' },
  colNombre: { width: '15%', textAlign: 'center' },
  colMontantLiv: { width: '20%', textAlign: 'right' },
  colMontantCmd: { width: '20%', textAlign: 'right' },
  colCommission: { width: '20%', textAlign: 'right' },
  totauxBox: {
    marginTop: 20,
    padding: 15,
    border: '2px solid #000',
    backgroundColor: '#fafafa',
  },
  totauxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totauxLabel: {
    fontSize: 12,
  },
  totauxValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FE3A31',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageNumber: {
    textAlign: 'center',
    color: 'grey',
  },
});

function formatDate(date: Date) {
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

const FacturePdf: React.FC<FacturePdfProps> = ({ factureDetail }) => {
  // TODO: Adapter le template PDF pour utiliser les vraies données de factureDetail
  // Une fois que le backend renverra le bon format avec les lignes de détails
  // Pour l'instant, on utilise les données mockées
  console.log('Facture Detail reçu:', factureDetail);

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Facture</Text>
              <Text style={styles.subtitle}>{facture.numero}</Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src="/assets/images/logo.png" style={styles.logo} />
          </View>
          <View>
            <Text style={styles.restaurantName}>{facture.client}</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodText}>Période</Text>
            <Text style={styles.periodDate}>
              {formatDate(facture.periode.debut)} - {formatDate(facture.periode.fin)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Rapport détaillé des livraisons</Text>
            <View style={styles.infoRow}>
              <Text
                style={{
                  fontWeight: 'semibold',
                }}
              >
                Fréquence de facturation:{' '}
              </Text>
              <Text>{facture.cyclePaiement}</Text>
            </View>
          </View>

          {/* TABLEAU DES LIGNES */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colNombre}>Nb Livr.</Text>
            <Text style={styles.colMontantLiv}>Montant Livr.</Text>
            <Text style={styles.colMontantCmd}>Montant Cmd</Text>
            <Text style={styles.colCommission}>Commission</Text>
          </View>

          {facture.lignes.map((ligne, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDate}>{formatDate(ligne.date)}</Text>
              <Text style={styles.colNombre}>{ligne.nombreLivraison}</Text>
              <Text style={styles.colMontantLiv}>{ligne.montantLivraison}</Text>
              <Text style={styles.colMontantCmd}>{ligne.montantCommandes}</Text>
              <Text style={styles.colCommission}>{ligne.totalCommission}</Text>
            </View>
          ))}

          {/* RECTANGLE DES TOTAUX */}
          <View style={styles.totauxBox} wrap={false}>
            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Total Montant Livraisons</Text>
              <Text style={styles.totauxValue}>{facture.totaux.montantLivraison} CFA</Text>
            </View>
            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Total Montant Commandes</Text>
              <Text style={styles.totauxValue}>{facture.totaux.montantCommandes} CFA</Text>
            </View>
            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Total Commissions</Text>
              <Text style={styles.totauxValue}>{facture.totaux.montantCommissions} CFA</Text>
            </View>
            <View style={[styles.totauxRow, { marginTop: 10, paddingTop: 10, borderTop: '2px solid #000' }]}>
              <Text style={styles.totalFinal}>MONTANT TOTAL À PAYER</Text>
              <Text style={styles.totalFinal}>{facture.totaux.factureAPayer} CFA</Text>
            </View>
          </View>
        </View>

        {/* PIED DE PAGE */}
        <View style={styles.footer} fixed>
          <Text>TURBO DELIVERY. SARL, sis à la rue Paul Langevin Prolongé</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text>RCN°CI - ABJ - 2019 - B - 18005</Text>
        </View>
      </Page>
    </Document>
  );
};

export default FacturePdf;
