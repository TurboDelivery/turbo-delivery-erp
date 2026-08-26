'use client';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { useEffectifQuery } from '@/features/personnel/queries/personnel-historisation.query';
import { formaterMontant } from '@/features/personnel/utils/personnel-historisation.utils';

/**
 * Bandeau de tête de la page Personnel : effectif, masse salariale figée, conformité,
 * anomalies. Il partage les requêtes des onglets (même clé react-query, donc aucun appel
 * supplémentaire).
 *
 * <p>Il portait sa propre carte, identique au caractère près à celle de la Supervision.
 * Les deux passent désormais par `CarteStat`.</p>
 *
 * <p>Sur échec, il RENVOYAIT NULL : le bandeau disparaissait sans un mot, et la Direction
 * lisait une page sans chiffres au lieu d'une page dont les chiffres n'ont pas pu être
 * lus. L'intention d'origine, écrite en commentaire, était de ne jamais empêcher la page
 * de s'afficher : elle est tenue, l'échec se limite à la place du bandeau et tout ce qui
 * suit reste accessible.</p>
 */
export function PersonnelKpis() {
  const { data, isError, isLoading, refetch } = useEffectifQuery();

  if (isError) {
    return <EtatErreur quoi="les indicateurs du personnel" onReessayer={() => refetch()} />;
  }

  const tiret = '—';

  return (
    <GrilleStats colonnes={4}>
      <CarteStat
        libelle="Effectif actif"
        valeur={data ? String(data.totalActifs) : tiret}
        note={`${data?.totalSortis ?? 0} sorti(s) conservé(s) en historique`}
        ton="succes"
        isLoading={isLoading}
      />
      <CarteStat
        libelle={`Masse salariale — ${data?.dernierMoisClotureLibelle ?? 'dernier mois clôturé'}`}
        valeur={data?.masseDernierMoisCloture != null ? formaterMontant(data.masseDernierMoisCloture) : tiret}
        note="instantané figé à la clôture"
        ton="primaire"
        isLoading={isLoading}
      />
      {/*
        Deux chiffres, pas un : « non déclaré » est une infraction constatée, « à confirmer »
        un état jamais renseigné. Les confondre reviendrait soit à crier au loup, soit — bien
        pire — à afficher une conformité que personne n'a vérifiée.
      */}
      <CarteStat
        libelle="Contrats non déclarés"
        valeur={data ? String(data.nonDeclares) : tiret}
        note={
          data
            ? `${data.aConfirmer} à confirmer (jamais renseigné) · risque de conformité sociale`
            : 'risque de conformité sociale'
        }
        ton="danger"
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Anomalies détectées"
        valeur={data ? String(data.totalAnomalies) : tiret}
        note="contrôle permanent des dossiers"
        ton="attention"
        isLoading={isLoading}
      />
    </GrilleStats>
  );
}
