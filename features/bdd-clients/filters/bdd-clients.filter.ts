import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';

/**
 * Les filtres de la base clients vivent dans l'URL.
 *
 * <p>Un écran de base de données se partage : « regarde les fidèles de Marcory qui n'ont
 * pas consenti » doit tenir dans un lien. Garder ces filtres en état local rendrait tout
 * lien partagé boiteux, le destinataire retombant sur la liste entière.</p>
 *
 * <p>⚠ Les clés sont PRÉFIXÉES `bc`. Plusieurs jeux de filtres cohabitent déjà dans l'URL
 * de cet ERP ; sans préfixe, `statut` ou `page` se marcheraient dessus d'un écran à
 * l'autre.</p>
 */
export const bddClientsFilters = {
  filter: {
    capturesMin: parseAsInteger,
    consentement: parseAsString.withDefault(''),
    debut: parseAsString.withDefault(''),
    fin: parseAsString.withDefault(''),
    logique: parseAsStringLiteral(['AU_MOINS_UN', 'TOUS'] as const).withDefault('AU_MOINS_UN'),
    page: parseAsInteger.withDefault(0),
    partenaires: parseAsArrayOf(parseAsString).withDefault([]),
    partenairesMin: parseAsInteger,
    recherche: parseAsString.withDefault(''),
    segment: parseAsString.withDefault(''),
    statut: parseAsString.withDefault(''),
    zones: parseAsArrayOf(parseAsString).withDefault([]),
  },
  option: {
    clearOnDefault: true,
    // La frappe dans la recherche ne doit pas écrire une entrée d'historique par
    // caractère, ni déclencher une lecture par caractère.
    throttleMs: 400,
    urlKeys: {
      capturesMin: 'bcCaptures',
      consentement: 'bcConsent',
      debut: 'bcDebut',
      fin: 'bcFin',
      logique: 'bcLogique',
      page: 'bcPage',
      partenaires: 'bcPart',
      partenairesMin: 'bcResto',
      recherche: 'bcQ',
      segment: 'bcSegment',
      statut: 'bcStatut',
      zones: 'bcZones',
    },
  },
} as const;
