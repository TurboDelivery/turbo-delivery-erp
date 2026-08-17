'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DatePicker,
  DateRangePicker,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  RangeValue,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tooltip,
} from '@heroui/react';
import { getLocalTimeZone, parseDate, startOfWeek, today } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  FileStack,
  Layers,
  MapPin,
  Receipt,
  Settings2,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  IConflitFacture,
  LIBELLE_COMPOSANTE,
  LIBELLE_CYCLE,
  LIBELLE_OBJET,
  useApercuPlageQuery,
  useConfigurationFacturationQuery,
  useGenererPlageMutation,
  usePeutChoisirModeFacturation,
  useReprendreFactureMutation,
} from '@/features/facturation-plage';
import { formatMontant, formatNombre } from '@/utils/format.utils';

const ZONE = getLocalTimeZone();

/** yyyy-MM-dd, la forme attendue par le serveur et comparable telle quelle. */
const versIso = (valeur: DateValue | null | undefined) =>
  valeur ? `${valeur.year}-${String(valeur.month).padStart(2, '0')}-${String(valeur.day).padStart(2, '0')}` : null;

const enDate = (iso: string) => {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
};

function Statistique({
  libelle,
  valeur,
  aide,
  accent,
}: {
  libelle: string;
  valeur: string;
  aide?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-large border p-4 ${
        accent ? 'border-primary-200 bg-primary-50/60' : 'border-default-200 bg-content1'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-default-500">{libelle}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-primary' : 'text-default-800'}`}>
        {valeur}
      </p>
      {aide ? <p className="mt-1 text-xs text-default-400">{aide}</p> : null}
    </div>
  );
}

function TableauConflits({ conflits }: { conflits: IConflitFacture[] }) {
  return (
    <Table removeWrapper aria-label="Factures en conflit" className="mt-3">
      <TableHeader>
        <TableColumn>RÉFÉRENCE</TableColumn>
        <TableColumn>PÉRIODE COUVERTE</TableColumn>
        <TableColumn>OBJET</TableColumn>
        <TableColumn>MONTANT</TableColumn>
        <TableColumn>ÉTAT</TableColumn>
      </TableHeader>
      <TableBody>
        {conflits.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-mono text-xs">{c.code}</TableCell>
            <TableCell className="text-sm">
              {enDate(c.periodeDebut)} au {enDate(c.periodeFin)}
            </TableCell>
            <TableCell className="text-sm">
              {LIBELLE_COMPOSANTE[c.composante] ?? c.composante}
            </TableCell>
            <TableCell className="text-sm font-semibold">{formatMontant(c.montant)}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color={c.financeWorkflowStatus ? 'warning' : 'default'}>
                {c.financeWorkflowStatus ?? c.statut ?? 'À valider'}
              </Chip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function FacturationPlageView() {
  const { data: partenaires, isLoading: chargementPartenaires } = useConfigurationFacturationQuery();
  const generer = useGenererPlageMutation();
  const reprendre = useReprendreFactureMutation();
  const peutChoisirLeMode = usePeutChoisirModeFacturation();

  // Période et partenaire lisibles dans l'URL, comme les autres pages finance : un
  // lien vers « Agha, 1er au 7 août » se partage, se met en favori et survit au retour
  // arrière du navigateur. C'est aussi ce qui permettra à l'écran des encours de
  // renvoyer ici sur une période précise.
  const parametres = useSearchParams();
  const [restaurantId, setRestaurantId] = useState<string | null>(
    () => parametres.get('restaurantId'),
  );
  const [plage, setPlage] = useState<RangeValue<DateValue> | null>(() => {
    const d = parametres.get('debut');
    const f = parametres.get('fin');
    if (!d || !f) return null;
    try {
      return { start: parseDate(d), end: parseDate(f) };
    } catch {
      return null; // paramètre malformé : on ouvre l'écran vide plutôt que de planter
    }
  });
  const [repriseOuverte, setRepriseOuverte] = useState(false);
  const [reference, setReference] = useState('');
  // §3.1.1 — le cahier decrit UN ecran de facturation avec les deux modes cote a cote :
  // « Par plage de dates », a cote du mode hebdomadaire existant « Choisir un creneau ».
  // Les separer en deux ecrans obligerait a savoir d'avance lequel utiliser.
  const [mode, setMode] = useState<'creneau' | 'plage'>(
    parametres.get('mode') === 'creneau' ? 'creneau' : 'plage',
  );

  const debut = versIso(plage?.start);
  const fin = versIso(plage?.end);

  const {
    data: apercu,
    isFetching: chargementApercu,
    error: erreurApercu,
    refetch: relancerApercu,
  } = useApercuPlageQuery(restaurantId, debut, fin);

  const partenaire = useMemo(
    () => partenaires?.find((p) => p.restaurantId === restaurantId) ?? null,
    [partenaires, restaurantId],
  );

  // §3.2 — « l'utilisateur habilité choisit à chaque génération entre le créneau
  // hebdomadaire et une plage libre ». Sur un partenaire en « Au choix », le choix est
  // donc réservé : les autres restent sur le créneau. Les cinq autres cycles ne sont pas
  // concernés, le cahier ne leur impose aucune habilitation.
  const modeVerrouille = partenaire?.cycleEffectif === 'AU_CHOIX' && !peutChoisirLeMode;
  const modeActif: 'creneau' | 'plage' = modeVerrouille ? 'creneau' : mode;

  const conflits = apercu?.conflits ?? [];
  const plageComplete = Boolean(restaurantId && debut && fin);
  const enCours = generer.isLoading || reprendre.isLoading;

  /**
   * Le mode creneau reste ce qu'il a toujours ete : une semaine calendaire, du lundi au
   * dimanche. Il remplit simplement les deux bornes, apres quoi tout le reste du parcours
   * est commun aux deux modes — meme apercu, meme controle de chevauchement, meme
   * generation. C'est ce qui permet au mode « Au choix a chaque facture » d'exister
   * vraiment : l'utilisateur bascule d'un mode a l'autre sans changer d'ecran.
   */
  const choisirCreneau = (jour: DateValue | null) => {
    if (!jour) {
      setPlage(null);
      return;
    }
    const lundi = startOfWeek(jour, 'fr-FR');
    setPlage({ start: lundi, end: lundi.add({ days: 6 }) });
  };

  const lancerGeneration = () => {
    if (!restaurantId || !debut || !fin) return;
    generer.mutate({ restaurantId, debut, fin });
  };

  const lancerReprise = () => {
    if (!restaurantId || !debut || !fin) return;
    reprendre.mutate(
      { restaurantId, debut, fin, reference: reference.trim() || undefined },
      {
        onSuccess: () => {
          setRepriseOuverte(false);
          setReference('');
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Facturation partenaire</h1>
          <p className="text-sm text-default-500">
            Par créneau hebdomadaire, ou sur une plage de dates librement choisie.
          </p>
        </div>
        <Button
          as={Link}
          href="/finance/cycle-facturation"
          variant="flat"
          startContent={<Settings2 className="h-4 w-4" />}
        >
          Configuration des cycles
        </Button>
      </div>

      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex items-center gap-2 pb-1 text-sm font-semibold text-default-700">
          <CalendarRange className="h-4 w-4 text-primary" />
          Période à facturer
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              aria-label="Mode de facturation"
              selectedKey={modeActif}
              disabledKeys={modeVerrouille ? ['plage'] : []}
              onSelectionChange={(k) => {
                setMode(k === 'creneau' ? 'creneau' : 'plage');
                setPlage(null);
              }}
              size="sm"
            >
              <Tab key="creneau" title="Choisir un créneau" />
              <Tab key="plage" title="Par plage de dates" />
            </Tabs>
            {modeVerrouille ? (
              <span className="text-xs text-default-500">
                La plage libre de ce partenaire est réservée au Comptable, au DG, au DGA et à
                l&apos;Admin.
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Autocomplete
            label="Partenaire"
            placeholder="Rechercher un établissement"
            selectedKey={restaurantId}
            onSelectionChange={(k) => setRestaurantId(k ? String(k) : null)}
            isLoading={chargementPartenaires}
            startContent={<Store className="h-4 w-4 text-default-400" />}
            className="lg:col-span-1"
          >
            {(partenaires ?? []).map((p) => (
              <AutocompleteItem key={p.restaurantId} value={p.restaurantId} textValue={p.nomEtablissement}>
                <div className="flex flex-col">
                  <span className="text-sm">{p.nomEtablissement}</span>
                  <span className="text-xs text-default-400">
                    {LIBELLE_CYCLE[(p.cycleEffectif ?? 'MENSUEL') as keyof typeof LIBELLE_CYCLE] ??
                      p.cycleEffectif}
                  </span>
                </div>
              </AutocompleteItem>
            ))}
          </Autocomplete>

          {modeActif === 'creneau' ? (
            <div className="lg:col-span-2">
              <DatePicker
                label="Semaine à facturer"
                aria-label="Semaine à facturer"
                value={plage?.start ?? null}
                onChange={choisirCreneau}
                maxValue={today(ZONE)}
                description={
                  plage
                    ? `Du ${enDate(versIso(plage.start)!)} au ${enDate(versIso(plage.end)!)}`
                    : 'Choisissez un jour : la semaine complète, du lundi au dimanche, sera facturée.'
                }
              />
            </div>
          ) : (
            <DateRangePicker
              label="Du → au"
              value={plage}
              onChange={setPlage}
              // RG-02 : la date de fin ne peut pas être postérieure à aujourd'hui. Le
              // serveur refuse de toute façon ; le bloquer ici évite de laisser
              // l'utilisateur composer une plage qui sera rejetée.
              maxValue={today(ZONE)}
              visibleMonths={2}
              className="lg:col-span-2"
            />
          )}
          </div>
        </CardBody>
      </Card>

      {partenaire ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Chip size="sm" variant="flat" startContent={<Layers className="ml-1 h-3 w-3" />}>
            Cycle : {LIBELLE_CYCLE[(partenaire.cycleEffectif ?? '') as keyof typeof LIBELLE_CYCLE] ?? partenaire.cycleEffectif ?? 'non défini'}
          </Chip>
          <Chip size="sm" variant="flat" color={partenaire.objetFacturation === 'GLOBALE' ? 'default' : 'secondary'}>
            {LIBELLE_OBJET[partenaire.objetFacturation]}
          </Chip>
          {partenaire.surCycleParDefaut ? (
            <span className="text-xs text-default-400">
              Jamais modifié dans l&apos;écran de configuration
            </span>
          ) : null}
        </div>
      ) : null}

      {partenaire && !['PLAGE_DATES', 'AU_CHOIX'].includes(partenaire.cycleEffectif ?? '') ? (
        <div className="flex items-start gap-2 rounded-large border border-warning-200 bg-warning-50/50 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium text-default-700">
              {partenaire.nomEtablissement} est sur un cycle généré automatiquement
            </p>
            <p className="text-xs text-default-500">
              Ses factures sont produites chaque nuit sur son cycle{' '}
              {LIBELLE_CYCLE[(partenaire.cycleEffectif ?? '') as keyof typeof LIBELLE_CYCLE] ??
                partenaire.cycleEffectif}
              . Facturer ici une période reste possible, et les jours facturés seront retirés du
              cycle automatique. Pour basculer ce partenaire en facturation à la demande, passez
              par la configuration des cycles.
            </p>
          </div>
        </div>
      ) : null}

      {!plageComplete ? (
        <Card shadow="none" className="border border-dashed border-default-300">
          <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarRange className="h-8 w-8 text-default-300" />
            <p className="text-sm text-default-500">
              Choisissez un partenaire et une plage de dates pour voir ce qui sera facturé.
            </p>
          </CardBody>
        </Card>
      ) : chargementApercu && !apercu ? (
        <div className="flex justify-center py-16">
          <Spinner color="primary" label="Calcul de la période…" />
        </div>
      ) : erreurApercu && !apercu ? (
        // Sans cette branche, un aperçu qui échoue laissait la page VIDE : l'utilisateur
        // choisissait ses dates et il ne se passait plus rien, sans rien à lire ni à faire.
        <Card shadow="none" className="border border-warning-200 bg-warning-50/40">
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-7 w-7 text-warning" />
            <div>
              <p className="text-sm font-semibold text-default-700">
                Impossible de calculer cette période
              </p>
              <p className="mt-1 text-xs text-default-500">
                {erreurApercu instanceof Error ? erreurApercu.message : 'Le serveur n’a pas répondu.'}
              </p>
            </div>
            <Button size="sm" variant="flat" onPress={() => relancerApercu()}>
              Réessayer
            </Button>
          </CardBody>
        </Card>
      ) : apercu ? (
        <>
          {conflits.length > 0 ? (
            <Card shadow="none" className="border border-danger-200 bg-danger-50/40">
              <CardHeader className="flex items-start gap-2 pb-1">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-danger">
                    Cette plage est déjà facturée, en tout ou en partie
                  </p>
                  <p className="text-xs text-danger-600">
                    {conflits.length === 1 ? 'Une facture couvre' : `${conflits.length} factures couvrent`}{' '}
                    des jours du {enDate(apercu.debut)} au {enDate(apercu.fin)}. Supprimez ou annulez
                    la facture concernée pour libérer ces jours, ou choisissez une autre plage.
                  </p>
                  {/* CE QUI RESTE A FACTURER, ET PAS SEULEMENT CE QUI BLOQUE.
                    * Le bandeau nommait les factures en conflit sans dire ce qu'elles
                    * couvraient : il fallait soustraire de tête pour s'apercevoir qu'il
                    * manquait 2,6 millions sur la plage (cas vécu le 17/08/2026). */}
                  {apercu.restantAFacturer > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-danger-700">
                      {formatMontant(apercu.dejaCouvert)} sont déjà couverts sur cette plage, mais{' '}
                      {formatMontant(apercu.restantAFacturer)} ne le sont par aucune facture.
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <TableauConflits conflits={conflits} />
              </CardBody>
            </Card>
          ) : null}

          <Card shadow="none" className="border border-default-200">
            <CardHeader className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-default-700">
                <Receipt className="h-4 w-4 text-primary" />
                Récapitulatif — {apercu.nomEtablissement}, du {enDate(apercu.debut)} au{' '}
                {enDate(apercu.fin)}
              </div>
              {chargementApercu ? <Spinner size="sm" color="primary" /> : null}
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Statistique
                  libelle="Courses terminées"
                  valeur={formatNombre(apercu.nombreCourses)}
                  aide="Hors courses rejetées ou en désactivation"
                />
                <Statistique libelle="Frais de livraison" valeur={formatMontant(apercu.fraisLivraison)} />
                <Statistique libelle="Commission" valeur={formatMontant(apercu.commission)} />
                <Statistique libelle="Total à facturer" valeur={formatMontant(apercu.total)} accent />
              </div>

              {apercu.zones.length > 0 ? (
                <>
                  <Divider />
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-default-700">
                      <MapPin className="h-4 w-4 text-primary" />
                      Détail par zone de livraison
                    </p>
                    <Table removeWrapper aria-label="Montant par zone">
                      <TableHeader>
                        <TableColumn>ZONE</TableColumn>
                        <TableColumn>COURSES</TableColumn>
                        <TableColumn>FRAIS DE LIVRAISON</TableColumn>
                        <TableColumn>COMMISSION</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {apercu.zones.map((z) => (
                          <TableRow key={z.zone}>
                            <TableCell className="text-sm">{z.zone}</TableCell>
                            <TableCell className="text-sm">{formatNombre(z.nombreCourses)}</TableCell>
                            <TableCell className="text-sm">{formatMontant(z.fraisLivraison)}</TableCell>
                            <TableCell className="text-sm">{formatMontant(z.commission)}</TableCell>
                            <TableCell className="text-sm font-semibold">
                              {formatMontant(z.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : null}

              {apercu.composantes.length > 1 ? (
                <>
                  <Divider />
                  <div className="flex items-start gap-2 rounded-large border border-secondary-200 bg-secondary-50/50 p-3">
                    <FileStack className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <div className="text-sm">
                      <p className="font-semibold text-secondary-700">
                        Cette validation créera {apercu.composantes.length} factures liées
                      </p>
                      <p className="text-xs text-default-500">
                        {apercu.nomEtablissement} est configuré en «{' '}
                        {LIBELLE_OBJET[apercu.objetFacturation]} ». La facture complémentaire est
                        générée automatiquement sur la même période et reste liée à la première.
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {apercu.composantes.map((c, i) => (
                          <span key={c} className="flex items-center gap-2">
                            {i > 0 ? <ArrowRight className="h-3 w-3 text-default-400" /> : null}
                            <Chip size="sm" variant="flat" color="secondary">
                              {LIBELLE_COMPOSANTE[c] ?? c} :{' '}
                              {formatMontant(c === 'FRAIS' ? apercu.fraisLivraison : c === 'COMMISSION' ? apercu.commission : apercu.total)}
                            </Chip>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {apercu.total <= 0 && conflits.length === 0 ? (
                <div className="flex items-center gap-2 rounded-large border border-default-200 bg-default-50 p-3 text-sm text-default-600">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Aucune course facturable sur cette période. Il n&apos;y a rien à facturer.
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Tooltip
              content="Enregistrer une facture déjà émise hors ERP sur cette plage, pour que les deux concordent"
              placement="top"
            >
              <Button
                variant="flat"
                isDisabled={!apercu.generable || enCours}
                onPress={() => setRepriseOuverte(true)}
              >
                Reprise hors ERP
              </Button>
            </Tooltip>
            <Button
              color="primary"
              startContent={<CheckCircle2 className="h-4 w-4" />}
              isDisabled={!apercu.generable}
              isLoading={generer.isLoading}
              onPress={lancerGeneration}
            >
              {apercu.composantes.length > 1
                ? `Générer les ${apercu.composantes.length} factures`
                : 'Générer la facture'}
            </Button>
          </div>
        </>
      ) : null}

      <Modal isOpen={repriseOuverte} onClose={() => setRepriseOuverte(false)} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Reprise d&apos;une facture émise hors ERP</span>
            <span className="text-xs font-normal text-default-500">
              Pour les factures établies dans l&apos;ancien fichier pendant la transition. Elles
              sont marquées « reprise » et alimentent les encours comme les autres.
            </span>
          </ModalHeader>
          <ModalBody className="space-y-3">
            {apercu ? (
              <div className="rounded-large border border-default-200 bg-default-50 p-3 text-sm">
                <p className="font-semibold">{apercu.nomEtablissement}</p>
                <p className="text-default-500">
                  Du {enDate(apercu.debut)} au {enDate(apercu.fin)} — {formatMontant(apercu.total)}
                </p>
              </div>
            ) : null}
            <Input
              label="Référence de la facture papier"
              placeholder="Ex. FICHIER-AGHA-0108"
              value={reference}
              onValueChange={setReference}
              description="Facultatif, pour rapprocher l'ERP et l'ancien fichier"
            />
            <p className="text-xs text-default-400">
              Le montant enregistré est celui calculé par l&apos;ERP sur la période : c&apos;est
              lui qui fait foi. La référence sert uniquement à retrouver la facture papier
              correspondante.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setRepriseOuverte(false)}>
              Annuler
            </Button>
            <Button color="primary" isLoading={reprendre.isLoading} onPress={lancerReprise}>
              Enregistrer la reprise
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
