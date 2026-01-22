import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { IReleveDePaie } from '@/features/tickets/utils/tickets-livreur-export.utils';

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    padding: 20,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111',
  },
  logo: {
    width: 100,
    height: 30,
    objectFit: 'contain',
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
  },
  company: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 10,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottom: '1px solid #000',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingBottom: 4,
    marginTop: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  tableTotalRow: {
    // Text en bold, bg en gris clair, et le total aligné à droite
    flexDirection: 'row',
    paddingVertical: 4,
    borderTop: '1px solid #000',
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    justifyContent: 'flex-end',
  },
  colDate: { width: '20%' },
  colRest: { width: '50%' },
  colAmount: { width: '30%', textAlign: 'right' },
  recapBox: {
    marginTop: 20,
    padding: 10,
    border: '1px solid #000',
  },
  net: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 5,
    left: 40,
    right: 40,
    fontSize: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageNumber: {
    textAlign: 'center',
    color: 'grey',
  },
});

export function RelevePaiePdf({ data, period }: { data: IReleveDePaie; period: string }) {
  return (
    <Document>
      <Page style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src="/assets/images/logo.png" style={styles.logo} />
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>RELEVÉ DE PAIE</Text>
          <Text>{period}</Text>
        </View>

        {/* EMPLOYEE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livreur</Text>
          <Text>Nom : {data.livreur}</Text>
          <Text>Nombre de jours travaillés : {data.nombreJoursTravailles}</Text>
        </View>

        {/* DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails des livraisons</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colRest}>Restaurant</Text>
            <Text style={styles.colAmount}>Montant (CFA)</Text>
          </View>

          {data.ticketsParJour.map((jour) => (
            <View key={jour.date}>
              {jour.restaurants.map((restaurant, index) => (
                <View key={`${restaurant.restaurant}-${jour.date}`} style={styles.tableRow}>
                  <Text style={styles.colDate}>{index === 0 ? jour.date : ''}</Text>
                  <Text style={styles.colRest}>{restaurant.restaurant}</Text>
                  <Text style={styles.colAmount}>{restaurant.totalCoutLivraison}</Text>
                </View>
              ))}
              <View style={styles.tableTotalRow}>
                <Text>{jour.totalJour}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* RECAP */}
        <View style={styles.recapBox} wrap={false}>
          <View style={styles.row}>
            <Text>Total général</Text>
            <Text>{data.totalGeneral} CFA</Text>
          </View>
          <View style={styles.row}>
            <Text>Pourcentage applicable</Text>
            <Text>{data.pourcentageApplicable}</Text>
          </View>
          <View style={styles.row}>
            <Text>Gain</Text>
            <Text>{data.gain} CFA</Text>
          </View>
          {/*<View style={styles.row}>*/}
          {/*  <Text>Déduction (Crédit TURBO)</Text>*/}
          {/*  <Text>{data.deduction} CFA</Text>*/}
          {/*</View>*/}

          <View style={[styles.row, { marginTop: 8, borderTop: '1px solid #000', paddingTop: 6 }]}>
            <Text style={styles.net}>Net à payer</Text>
            <Text style={styles.net}>{data.netAPayer} CFA</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>TURBO DELIVERY. SARL, sis à la rue Paul Langevin Prolongé</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text>RCN°CI - ABJ - 2019 - B - 18005</Text>
        </View>
      </Page>
    </Document>
  );
}
