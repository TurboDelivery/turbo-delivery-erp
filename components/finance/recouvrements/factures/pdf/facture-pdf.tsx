'use client';
import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IFactureDetail } from '@/features/recouvrements/types/facture.types';

interface FacturePdfProps {
  factureDetail: IFactureDetail;
}

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

// Fonction pour formater une date depuis une chaîne ISO
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return dateString;
  }
}

const FacturePdf: React.FC<FacturePdfProps> = ({ factureDetail }) => {
  return (
    <Document title={factureDetail.code}>
      <Page style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Facture</Text>
              <Text style={styles.subtitle}>{factureDetail.code}</Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src="/assets/images/logo.png" style={styles.logo} />
          </View>
          <View>
            <Text style={styles.restaurantName}>{factureDetail.restaurant}</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodText}>Période</Text>
            <Text style={styles.periodDate}>
              {formatDate(factureDetail.periode.debut)} - {formatDate(factureDetail.periode.fin)}
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
              <Text>{factureDetail.cyclePaiement}</Text>
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

          {factureDetail.lignes.map((ligne, index) => (
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
              <Text style={styles.totauxValue}>{factureDetail.totaux.montantLivraison}</Text>
            </View>
            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Total Montant Commandes</Text>
              <Text style={styles.totauxValue}>{factureDetail.totaux.montantCommandes}</Text>
            </View>
            <View style={styles.totauxRow}>
              <Text style={styles.totauxLabel}>Total Commissions</Text>
              <Text style={styles.totauxValue}>{factureDetail.totaux.montantCommissions}</Text>
            </View>
            <View style={[styles.totauxRow, { marginTop: 10, paddingTop: 10, borderTop: '2px solid #000' }]}>
              <Text style={styles.totalFinal}>MONTANT TOTAL À PAYER</Text>
              <Text style={styles.totalFinal}>{factureDetail.totaux.factureAPayer}</Text>
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
