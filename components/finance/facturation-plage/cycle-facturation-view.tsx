'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import { CalendarRange, Info, RotateCcw, Search, Settings2 } from 'lucide-react';
import Link from 'next/link';

import {
  CYCLES_FACTURATION,
  CycleFacturation,
  IConfigurationPartenaire,
  LIBELLE_CYCLE,
  LIBELLE_OBJET,
  OBJETS_FACTURATION,
  ObjetFacturation,
  useConfigurationFacturationQuery,
  useEnregistrerConfigurationMutation,
  usePeutChoisirModeFacturation,
} from '@/features/facturation-plage';

/**
 * L'écran unique de configuration du cycle de facturation partenaire (RG-03).
 *
 * <p>Une ligne par partenaire, un choix de cycle, un objet de facturation. Chaque
 * changement part immédiatement au serveur : il n'y a pas de bouton « Enregistrer »
 * global, parce qu'un tableau de 70 lignes avec un enregistrement différé fait
 * inévitablement perdre des modifications.</p>
 *
 * <p>La colonne « Statut » dit l'essentiel de RG-07 : tant qu'un partenaire n'a pas été
 * touché ici, il suit son cycle historique et se comporte exactement comme avant.</p>
 */
export function CycleFacturationView() {
  const { data, isLoading } = useConfigurationFacturationQuery();
  const enregistrer = useEnregistrerConfigurationMutation();
  // §3.2 — « Au choix a chaque facture » est reserve au Comptable, DG, DGA et Admin.
  // Le serveur refuse de toute facon ; on ne propose pas une option qui serait rejetee.
  const peutPoserAuChoix = usePeutChoisirModeFacturation();

  const [recherche, setRecherche] = useState('');
  const [ligneEnCours, setLigneEnCours] = useState<string | null>(null);

  const partenaires = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const liste = data ?? [];
    if (!terme) return liste;
    return liste.filter((p) => (p.nomEtablissement ?? '').toLowerCase().includes(terme));
  }, [data, recherche]);

  const nbConfigures = useMemo(
    () => (data ?? []).filter((p) => !p.surCycleParDefaut).length,
    [data],
  );

  const appliquer = (
    partenaire: IConfigurationPartenaire,
    patch: Partial<{ cycle: CycleFacturation | null; objet: ObjetFacturation | null }>,
  ) => {
    setLigneEnCours(partenaire.restaurantId);
    enregistrer.mutate(
      {
        restaurantId: partenaire.restaurantId,
        dto: {
          cycleFacturation: patch.cycle !== undefined ? patch.cycle : partenaire.cycleChoisi,
          objetFacturation:
            patch.objet !== undefined
              ? patch.objet
              : partenaire.objetFacturation === 'GLOBALE'
                ? null
                : partenaire.objetFacturation,
        },
      },
      { onSettled: () => setLigneEnCours(null) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner color="primary" label="Chargement des partenaires…" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Configuration cycle de facturation partenaire
          </h1>
          <p className="text-sm text-default-500">
            Un seul endroit pour définir comment chaque partenaire est facturé.
          </p>
        </div>
        <Button
          as={Link}
          href="/finance/facturation-plage"
          variant="flat"
          startContent={<CalendarRange className="h-4 w-4" />}
        >
          Facturer un partenaire
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-large border border-default-200 bg-default-50 p-3 text-sm text-default-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p>
            Un partenaire non modifié ici continue de fonctionner exactement comme aujourd&apos;hui,
            sur son cycle historique. Rien n&apos;est migré automatiquement.
          </p>
          <p className="mt-1 text-xs text-default-500">
            {nbConfigures} partenaire{nbConfigures > 1 ? 's' : ''} sur {(data ?? []).length}{' '}
            {nbConfigures > 1 ? 'ont' : 'a'} un cycle défini dans cet écran.
          </p>
        </div>
      </div>

      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-default-700">
            <Settings2 className="h-4 w-4 text-primary" />
            {partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''}
          </div>
          <Input
            size="sm"
            className="max-w-xs"
            placeholder="Rechercher un établissement"
            value={recherche}
            onValueChange={setRecherche}
            startContent={<Search className="h-4 w-4 text-default-400" />}
            isClearable
            onClear={() => setRecherche('')}
          />
        </CardHeader>
        <CardBody>
          <Table removeWrapper aria-label="Cycle de facturation par partenaire">
            <TableHeader>
              <TableColumn>PARTENAIRE</TableColumn>
              <TableColumn>CYCLE DE FACTURATION</TableColumn>
              <TableColumn>OBJET DE LA FACTURE</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn> </TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun partenaire ne correspond à cette recherche.">
              {partenaires.map((p) => {
                const enCours = ligneEnCours === p.restaurantId && enregistrer.isLoading;
                const cycleAffiche = (p.cycleChoisi ?? p.cycleHistorique ?? '') as CycleFacturation;
                return (
                  <TableRow key={p.restaurantId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{p.nomEtablissement}</span>
                        {!p.actif ? (
                          <span className="text-xs text-default-400">Établissement inactif</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="sm"
                        aria-label={`Cycle de ${p.nomEtablissement}`}
                        className="max-w-[230px]"
                        selectedKeys={cycleAffiche ? [cycleAffiche] : []}
                        isDisabled={enCours}
                        onSelectionChange={(k) => {
                          const choix = String(Array.from(k)[0] ?? '') as CycleFacturation;
                          if (!choix || choix === p.cycleChoisi) return;
                          appliquer(p, { cycle: choix });
                        }}
                      >
                        {CYCLES_FACTURATION.filter(
                          // On laisse l'option visible si le partenaire y est deja, sinon
                          // sa ligne afficherait une case vide.
                          (c) => c !== 'AU_CHOIX' || peutPoserAuChoix || cycleAffiche === 'AU_CHOIX',
                        ).map((c) => (
                          <SelectItem key={c} value={c}>
                            {LIBELLE_CYCLE[c]}
                          </SelectItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="sm"
                        aria-label={`Objet de facturation de ${p.nomEtablissement}`}
                        className="max-w-[260px]"
                        selectedKeys={[p.objetFacturation]}
                        isDisabled={enCours}
                        onSelectionChange={(k) => {
                          const choix = String(Array.from(k)[0] ?? '') as ObjetFacturation;
                          if (!choix || choix === p.objetFacturation) return;
                          appliquer(p, { objet: choix === 'GLOBALE' ? null : choix });
                        }}
                      >
                        {OBJETS_FACTURATION.map((o) => (
                          <SelectItem key={o} value={o}>
                            {LIBELLE_OBJET[o]}
                          </SelectItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      {p.surCycleParDefaut ? (
                        <Tooltip
                          content={`Suit son cycle historique (${LIBELLE_CYCLE[(p.cycleHistorique ?? '') as CycleFacturation] ?? p.cycleHistorique ?? 'non défini'})`}
                          placement="top"
                        >
                          <Chip size="sm" variant="flat">
                            Par défaut
                          </Chip>
                        </Tooltip>
                      ) : (
                        <Chip size="sm" variant="flat" color="primary">
                          Configuré
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      {enCours ? (
                        <Spinner size="sm" color="primary" />
                      ) : !p.surCycleParDefaut ? (
                        <Tooltip content="Remettre ce partenaire sur son cycle historique" placement="top">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            aria-label="Remettre par défaut"
                            onPress={() => appliquer(p, { cycle: null })}
                          >
                            <RotateCcw className="h-4 w-4 text-default-400" />
                          </Button>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <p className="text-xs text-default-400">
        « Plage de dates » et « Au choix à chaque facture » suspendent la génération automatique :
        les factures de ces partenaires se produisent depuis l&apos;écran « Facturation partenaire »,
        par créneau hebdomadaire ou sur une plage librement définie. Les quatre autres cycles
        restent générés chaque nuit, sans changement.
      </p>
    </div>
  );
}
