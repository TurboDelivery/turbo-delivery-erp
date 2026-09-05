'use client';

import {
    Button,
    Calendar,
    Card,
    Chip,
    ComboBox,
    DateField,
    DatePicker,
    DateRangePicker,
    Description,
    Input,
    InputGroup,
    Label,
    ListBox,
    Modal,
    RangeCalendar,
    Separator,
    Spinner,
    Table,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@heroui-v3/react';
import { getLocalTimeZone, parseDate, startOfWeek, today } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileStack,
    Layers,
    MapPin,
    Receipt,
    Settings2,
    Store,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
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

/** Une plage de dates, telle que la v3 la manipule (la v2 exportait un type `RangeValue`). */
type PlageDates = { end: DateValue; start: DateValue };

/** yyyy-MM-dd, la forme attendue par le serveur et comparable telle quelle. */
const versIso = (valeur: DateValue | null | undefined) =>
    valeur
        ? `${valeur.year}-${String(valeur.month).padStart(2, '0')}-${String(valeur.day).padStart(2, '0')}`
        : null;

const enDate = (iso: string) => {
    const [a, m, j] = iso.split('-');
    return `${j}/${m}/${a}`;
};

/** Les colonnes du tableau des conflits, déclarées une fois. */
const COLONNES_CONFLITS = ['Référence', 'Période couverte', 'Objet', 'Montant', 'État'] as const;

/** Les colonnes du détail par zone, déclarées une fois. */
const COLONNES_ZONES = ['Zone', 'Courses', 'Frais de livraison', 'Commission', 'Total'] as const;

function TableauConflits({ conflits }: { conflits: IConflitFacture[] }) {
    return (
        <Table className="mt-3">
            <Table.ScrollContainer>
                <Table.Content aria-label="Factures en conflit">
                    <Table.Header>
                        {COLONNES_CONFLITS.map((c) => (
                            <Table.Column id={c} isRowHeader={c === 'Référence'} key={c}>
                                {c}
                            </Table.Column>
                        ))}
                    </Table.Header>
                    <Table.Body>
                        {conflits.map((c) => (
                            <Table.Row id={c.id} key={c.id}>
                                <Table.Cell className="font-mono text-xs">{c.code}</Table.Cell>
                                <Table.Cell className="text-sm">
                                    {enDate(c.periodeDebut)} au {enDate(c.periodeFin)}
                                </Table.Cell>
                                <Table.Cell className="text-sm">
                                    {LIBELLE_COMPOSANTE[c.composante] ?? c.composante}
                                </Table.Cell>
                                <Table.Cell className="text-sm font-semibold tabular-nums">
                                    {formatMontant(c.montant)}
                                </Table.Cell>
                                <Table.Cell>
                                    <Chip
                                        color={c.financeWorkflowStatus ? 'warning' : 'default'}
                                        size="sm"
                                        variant="soft"
                                    >
                                        <Chip.Label>
                                            {c.financeWorkflowStatus ?? c.statut ?? 'À valider'}
                                        </Chip.Label>
                                    </Chip>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    );
}

/** Le choix d'un jour, qui vaut choix de sa semaine. */
function SelecteurSemaine({
    aide,
    onChange,
    valeur,
}: {
    aide: string;
    onChange: (d: DateValue | null) => void;
    valeur: DateValue | null;
}) {
    return (
        <DatePicker maxValue={today(ZONE)} onChange={onChange} value={valeur}>
            <Label>Semaine à facturer</Label>
            <DateField.Group>
                <DateField.Input>
                    {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                        <DateField.Segment segment={segment} />
                    )}
                </DateField.Input>
                <DatePicker.Trigger>
                    <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
            </DateField.Group>
            <Description>{aide}</Description>
            <DatePicker.Popover>
                <Calendar>
                    <Calendar.Header>
                        <Calendar.NavButton slot="previous">
                            <ChevronLeft aria-hidden="true" className="size-4" />
                        </Calendar.NavButton>
                        <Calendar.Heading />
                        <Calendar.NavButton slot="next">
                            <ChevronRight aria-hidden="true" className="size-4" />
                        </Calendar.NavButton>
                    </Calendar.Header>
                    <Calendar.Grid>
                        <Calendar.GridHeader>
                            {(jour) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                </Calendar>
            </DatePicker.Popover>
        </DatePicker>
    );
}

/** Le choix des deux bornes, librement. */
function SelecteurPlage({
    onChange,
    valeur,
}: {
    onChange: (p: PlageDates | null) => void;
    valeur: PlageDates | null;
}) {
    return (
        <DateRangePicker
            className="lg:col-span-2"
            // RG-02 : la date de fin ne peut pas être postérieure à aujourd'hui. Le
            // serveur refuse de toute façon ; le bloquer ici évite de laisser
            // l'utilisateur composer une plage qui sera rejetée.
            maxValue={today(ZONE)}
            onChange={onChange}
            value={valeur}
        >
            <Label>Du → au</Label>
            <DateField.Group>
                <DateField.Input slot="start">
                    {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                        <DateField.Segment segment={segment} />
                    )}
                </DateField.Input>
                <DateRangePicker.RangeSeparator />
                <DateField.Input slot="end">
                    {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                        <DateField.Segment segment={segment} />
                    )}
                </DateField.Input>
                <DateRangePicker.Trigger>
                    <CalendarDays aria-hidden="true" className="size-4" />
                </DateRangePicker.Trigger>
            </DateField.Group>
            <DateRangePicker.Popover>
                <RangeCalendar visibleDuration={{ months: 2 }}>
                    <RangeCalendar.Header>
                        <RangeCalendar.NavButton slot="previous">
                            <ChevronLeft aria-hidden="true" className="size-4" />
                        </RangeCalendar.NavButton>
                        <RangeCalendar.Heading />
                        <RangeCalendar.NavButton slot="next">
                            <ChevronRight aria-hidden="true" className="size-4" />
                        </RangeCalendar.NavButton>
                    </RangeCalendar.Header>
                    <RangeCalendar.Grid>
                        <RangeCalendar.GridHeader>
                            {(jour) => <RangeCalendar.HeaderCell>{jour}</RangeCalendar.HeaderCell>}
                        </RangeCalendar.GridHeader>
                        <RangeCalendar.GridBody>
                            {(date) => <RangeCalendar.Cell date={date} />}
                        </RangeCalendar.GridBody>
                    </RangeCalendar.Grid>
                </RangeCalendar>
            </DateRangePicker.Popover>
        </DateRangePicker>
    );
}

export function FacturationPlageView() {
    const {
        data: partenaires,
        isError: erreurPartenaires,
        isFetching: relancePartenaires,
        isLoading: chargementPartenaires,
        refetch: relancerPartenaires,
    } = useConfigurationFacturationQuery();
    const generer = useGenererPlageMutation();
    const reprendre = useReprendreFactureMutation();
    const peutChoisirLeMode = usePeutChoisirModeFacturation();

    // Période et partenaire lisibles dans l'URL, comme les autres pages finance : un
    // lien vers « Agha, 1er au 7 août » se partage, se met en favori et survit au retour
    // arrière du navigateur. C'est aussi ce qui permettra à l'écran des encours de
    // renvoyer ici sur une période précise.
    const parametres = useSearchParams();
    const [restaurantId, setRestaurantId] = useState<string | null>(() =>
        parametres.get('restaurantId'),
    );
    const [plage, setPlage] = useState<PlageDates | null>(() => {
        const d = parametres.get('debut');
        const f = parametres.get('fin');
        if (!d || !f) return null;
        try {
            return { end: parseDate(f), start: parseDate(d) };
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
        error: erreurApercu,
        isFetching: chargementApercu,
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
    const enCours = generer.isPending || reprendre.isPending;

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
        setPlage({ end: lundi.add({ days: 6 }), start: lundi });
    };

    const lancerGeneration = () => {
        if (!restaurantId || !debut || !fin) return;
        generer.mutate({ debut, fin, restaurantId });
    };

    const lancerReprise = () => {
        if (!restaurantId || !debut || !fin) return;
        reprendre.mutate(
            { debut, fin, reference: reference.trim() || undefined, restaurantId },
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
                    <h1 className="text-2xl font-bold text-foreground">Facturation partenaire</h1>
                    <p className="text-sm text-muted">
                        Par créneau hebdomadaire, ou sur une plage de dates librement choisie.
                    </p>
                </div>
                <LienBouton href="/finance/cycle-facturation" variante="outline">
                    <Settings2 aria-hidden="true" className="size-4" />
                    Configuration des cycles
                </LienBouton>
            </div>

            <Card>
                <Card.Header className="flex-row items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarRange aria-hidden="true" className="size-4 text-muted" />
                    Période à facturer
                </Card.Header>
                <Card.Content className="gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/*
                         * `ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` fait tomber la page
                         * (« <SharedElement> must be rendered inside a <SharedElementTransition> »)
                         * et, sans lui, les onglets ne distinguent l'actif que par une nuance de
                         * gris. Ici le mode indisponible doit AUSSI se voir desactive, ce que
                         * `disabledKeys` porte a l'identique.
                         */}
                        <ToggleButtonGroup
                            onSelectionChange={(sel) => {
                                const k = String(Array.from(sel)[0] ?? 'plage');
                                setMode(k === 'creneau' ? 'creneau' : 'plage');
                                setPlage(null);
                            }}
                            selectedKeys={new Set([modeActif])}
                            selectionMode="single"
                            size="sm"
                        >
                            <ToggleButton id="creneau">Choisir un créneau</ToggleButton>
                            {/* Le mode indisponible reste VISIBLE et desactive : le retirer
                                ferait croire qu'il n'existe pas, alors qu'il est reserve. */}
                            <ToggleButton id="plage" isDisabled={modeVerrouille}>
                                Par plage de dates
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {modeVerrouille ? (
                            <span className="text-xs text-muted">
                                La plage libre de ce partenaire est réservée au Comptable, au DG, au DGA
                                et à l&apos;Admin.
                            </span>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <ComboBox
                            className="lg:col-span-1"
                            onSelectionChange={(k) => setRestaurantId(k ? String(k) : null)}
                            selectedKey={restaurantId}
                        >
                            <Label>Partenaire</Label>
                            <ComboBox.InputGroup>
                                <Input
                                    placeholder={
                                        chargementPartenaires ? 'Chargement…' : 'Rechercher un établissement'
                                    }
                                />
                                <ComboBox.Trigger />
                            </ComboBox.InputGroup>
                            <ComboBox.Popover>
                                <ListBox items={partenaires ?? []}>
                                    {(p: {
                                        cycleEffectif?: string | null;
                                        nomEtablissement: string;
                                        restaurantId: string;
                                    }) => (
                                        <ListBox.Item
                                            id={p.restaurantId}
                                            textValue={p.nomEtablissement}
                                        >
                                            <span className="flex min-w-0 flex-col">
                                                <span className="text-sm">{p.nomEtablissement}</span>
                                                <span className="text-xs text-muted">
                                                    {LIBELLE_CYCLE[
                                                        (p.cycleEffectif ??
                                                            'MENSUEL') as keyof typeof LIBELLE_CYCLE
                                                    ] ?? p.cycleEffectif}
                                                </span>
                                            </span>
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    )}
                                </ListBox>
                            </ComboBox.Popover>
                        </ComboBox>

                        {modeActif === 'creneau' ? (
                            <div className="lg:col-span-2">
                                <SelecteurSemaine
                                    aide={
                                        plage
                                            ? `Du ${enDate(versIso(plage.start)!)} au ${enDate(versIso(plage.end)!)}`
                                            : 'Choisissez un jour : la semaine complète, du lundi au dimanche, sera facturée.'
                                    }
                                    onChange={choisirCreneau}
                                    valeur={plage?.start ?? null}
                                />
                            </div>
                        ) : (
                            <SelecteurPlage onChange={setPlage} valeur={plage} />
                        )}
                    </div>
                </Card.Content>
            </Card>

            {partenaire ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Chip size="sm" variant="soft">
                        <Layers aria-hidden="true" className="size-3" />
                        <Chip.Label>
                            Cycle :{' '}
                            {LIBELLE_CYCLE[
                                (partenaire.cycleEffectif ?? '') as keyof typeof LIBELLE_CYCLE
                            ] ??
                                partenaire.cycleEffectif ??
                                'non défini'}
                        </Chip.Label>
                    </Chip>
                    <Chip size="sm" variant="soft">
                        <Chip.Label>{LIBELLE_OBJET[partenaire.objetFacturation]}</Chip.Label>
                    </Chip>
                    {partenaire.surCycleParDefaut ? (
                        <span className="text-xs text-muted">
                            Jamais modifié dans l&apos;écran de configuration
                        </span>
                    ) : null}
                </div>
            ) : null}

            {partenaire && !['PLAGE_DATES', 'AU_CHOIX'].includes(partenaire.cycleEffectif ?? '') ? (
                <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
                    <AlertTriangle
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                    />
                    <div>
                        <p className="font-medium text-foreground">
                            {partenaire.nomEtablissement} est sur un cycle généré automatiquement
                        </p>
                        <p className="text-xs text-muted">
                            Ses factures sont produites chaque nuit sur son cycle{' '}
                            {LIBELLE_CYCLE[
                                (partenaire.cycleEffectif ?? '') as keyof typeof LIBELLE_CYCLE
                            ] ?? partenaire.cycleEffectif}
                            . Facturer ici une période reste possible, et les jours facturés seront
                            retirés du cycle automatique. Pour basculer ce partenaire en facturation à la
                            demande, passez par la configuration des cycles.
                        </p>
                    </div>
                </div>
            ) : null}

            {erreurPartenaires && !partenaires ? (
                // Liste des partenaires en echec : l'autocomplete restait vide et l'invitation a
                // « choisir un partenaire » se lisait comme s'il n'y en avait aucun a facturer.
                <EtatErreur
                    enCours={relancePartenaires}
                    onReessayer={() => relancerPartenaires()}
                    quoi="les partenaires à facturer"
                />
            ) : !plageComplete ? (
                <Card className="border-dashed">
                    <Card.Content className="items-center gap-2 py-12 text-center">
                        <CalendarRange aria-hidden="true" className="size-8 text-muted" />
                        <p className="text-sm text-muted">
                            Choisissez un partenaire et une plage de dates pour voir ce qui sera facturé.
                        </p>
                    </Card.Content>
                </Card>
            ) : chargementApercu && !apercu ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <Spinner />
                    <p className="text-sm text-muted">Calcul de la période…</p>
                </div>
            ) : erreurApercu && !apercu ? (
                // Sans cette branche, un aperçu qui échoue laissait la page VIDE : l'utilisateur
                // choisissait ses dates et il ne se passait plus rien, sans rien à lire ni à faire.
                <Card className="border-warning/30 bg-warning/10">
                    <Card.Content className="items-center gap-3 py-10 text-center">
                        <AlertTriangle
                            aria-hidden="true"
                            className="size-7 text-warning-soft-foreground"
                        />
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Impossible de calculer cette période
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {erreurApercu instanceof Error
                                    ? erreurApercu.message
                                    : 'Le serveur n’a pas répondu.'}
                            </p>
                        </div>
                        <Button onPress={() => relancerApercu()} size="sm" variant="outline">
                            Réessayer
                        </Button>
                    </Card.Content>
                </Card>
            ) : apercu ? (
                <>
                    {conflits.length > 0 ? (
                        <Card className="border-danger/30 bg-danger/5">
                            <Card.Header className="flex-row items-start gap-2">
                                <AlertTriangle
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-danger-soft-foreground"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-danger-soft-foreground">
                                        Cette plage est déjà facturée, en tout ou en partie
                                    </p>
                                    <p className="text-xs text-muted">
                                        {conflits.length === 1
                                            ? 'Une facture couvre'
                                            : `${conflits.length} factures couvrent`}{' '}
                                        des jours du {enDate(apercu.debut)} au {enDate(apercu.fin)}.
                                        Supprimez ou annulez la facture concernée pour libérer ces jours, ou
                                        choisissez une autre plage.
                                    </p>
                                    {/* CE QUI RESTE A FACTURER, ET PAS SEULEMENT CE QUI BLOQUE.
                                      * Le bandeau nommait les factures en conflit sans dire ce qu'elles
                                      * couvraient : il fallait soustraire de tête pour s'apercevoir qu'il
                                      * manquait 2,6 millions sur la plage (cas vécu le 17/08/2026). */}
                                    {apercu.restantAFacturer > 0 ? (
                                        <p className="mt-1 text-xs font-semibold text-danger-soft-foreground">
                                            {formatMontant(apercu.dejaCouvert)} sont déjà couverts sur cette
                                            plage, mais {formatMontant(apercu.restantAFacturer)} ne le sont
                                            par aucune facture.
                                        </p>
                                    ) : null}
                                </div>
                            </Card.Header>
                            <Card.Content className="pt-0">
                                <TableauConflits conflits={conflits} />
                            </Card.Content>
                        </Card>
                    ) : null}

                    <Card>
                        <Card.Header className="flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Receipt aria-hidden="true" className="size-4 text-muted" />
                                Récapitulatif — {apercu.nomEtablissement}, du {enDate(apercu.debut)} au{' '}
                                {enDate(apercu.fin)}
                            </div>
                            {chargementApercu ? <Spinner size="sm" /> : null}
                        </Card.Header>
                        <Card.Content className="gap-4">
                            <GrilleStats colonnes={4}>
                                <CarteStat
                                    libelle="Courses terminées"
                                    note="Hors courses rejetées ou en désactivation"
                                    valeur={formatNombre(apercu.nombreCourses)}
                                />
                                <CarteStat
                                    libelle="Frais de livraison"
                                    valeur={formatMontant(apercu.fraisLivraison)}
                                />
                                <CarteStat libelle="Commission" valeur={formatMontant(apercu.commission)} />
                                <CarteStat
                                    accent
                                    libelle="Total à facturer"
                                    ton="primaire"
                                    valeur={formatMontant(apercu.total)}
                                />
                            </GrilleStats>

                            {apercu.zones.length > 0 ? (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <MapPin aria-hidden="true" className="size-4 text-muted" />
                                            Détail par zone de livraison
                                        </p>
                                        <Table>
                                            <Table.ScrollContainer>
                                                <Table.Content aria-label="Montant par zone">
                                                    <Table.Header>
                                                        {COLONNES_ZONES.map((c) => (
                                                            <Table.Column
                                                                id={c}
                                                                isRowHeader={c === 'Zone'}
                                                                key={c}
                                                            >
                                                                {c}
                                                            </Table.Column>
                                                        ))}
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {apercu.zones.map((z) => (
                                                            <Table.Row id={z.zone} key={z.zone}>
                                                                <Table.Cell className="text-sm">
                                                                    {z.zone}
                                                                </Table.Cell>
                                                                <Table.Cell className="text-sm tabular-nums">
                                                                    {formatNombre(z.nombreCourses)}
                                                                </Table.Cell>
                                                                <Table.Cell className="text-sm tabular-nums">
                                                                    {formatMontant(z.fraisLivraison)}
                                                                </Table.Cell>
                                                                <Table.Cell className="text-sm tabular-nums">
                                                                    {formatMontant(z.commission)}
                                                                </Table.Cell>
                                                                <Table.Cell className="text-sm font-semibold tabular-nums">
                                                                    {formatMontant(z.total)}
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                                </Table.Content>
                                            </Table.ScrollContainer>
                                        </Table>
                                    </div>
                                </>
                            ) : null}

                            {apercu.composantes.length > 1 ? (
                                <>
                                    <Separator />
                                    <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft/30 p-3">
                                        <FileStack
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-accent"
                                        />
                                        <div className="text-sm">
                                            <p className="font-semibold text-foreground">
                                                Cette validation créera {apercu.composantes.length} factures
                                                liées
                                            </p>
                                            <p className="text-xs text-muted">
                                                {apercu.nomEtablissement} est configuré en «{' '}
                                                {LIBELLE_OBJET[apercu.objetFacturation]} ». La facture
                                                complémentaire est générée automatiquement sur la même période
                                                et reste liée à la première.
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                {apercu.composantes.map((c, i) => (
                                                    <span className="flex items-center gap-2" key={c}>
                                                        {i > 0 ? (
                                                            <ArrowRight
                                                                aria-hidden="true"
                                                                className="size-3 text-muted"
                                                            />
                                                        ) : null}
                                                        <Chip size="sm" variant="soft">
                                                            <Chip.Label>
                                                                {LIBELLE_COMPOSANTE[c] ?? c} :{' '}
                                                                {formatMontant(
                                                                    c === 'FRAIS'
                                                                        ? apercu.fraisLivraison
                                                                        : c === 'COMMISSION'
                                                                          ? apercu.commission
                                                                          : apercu.total,
                                                                )}
                                                            </Chip.Label>
                                                        </Chip>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}

                            {apercu.total <= 0 && conflits.length === 0 ? (
                                <div className="flex items-center gap-2 rounded-xl border border-separator bg-surface-secondary p-3 text-sm text-muted">
                                    <AlertTriangle
                                        aria-hidden="true"
                                        className="size-4 text-warning-soft-foreground"
                                    />
                                    Aucune course facturable sur cette période. Il n&apos;y a rien à
                                    facturer.
                                </div>
                            ) : null}
                        </Card.Content>
                    </Card>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Tooltip>
                            <Button
                                isDisabled={!apercu.generable || enCours}
                                onPress={() => setRepriseOuverte(true)}
                                variant="outline"
                            >
                                Reprise hors ERP
                            </Button>
                            <Tooltip.Content>
                                Enregistrer une facture déjà émise hors ERP sur cette plage, pour que les
                                deux concordent
                            </Tooltip.Content>
                        </Tooltip>
                        <Button
                            isDisabled={!apercu.generable}
                            isPending={generer.isPending}
                            onPress={lancerGeneration}
                            variant="primary"
                        >
                            <CheckCircle2 aria-hidden="true" className="size-4" />
                            {apercu.composantes.length > 1
                                ? `Générer les ${apercu.composantes.length} factures`
                                : 'Générer la facture'}
                        </Button>
                    </div>
                </>
            ) : null}

            <Modal isOpen={repriseOuverte} onOpenChange={(o) => !o && setRepriseOuverte(false)}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="max-w-lg">
                            <Modal.Header>
                                <Modal.Heading className="flex flex-col gap-1">
                                    <span>Reprise d&apos;une facture émise hors ERP</span>
                                    <span className="text-xs font-normal text-muted">
                                        Pour les factures établies dans l&apos;ancien fichier pendant la
                                        transition. Elles sont marquées « reprise » et alimentent les encours
                                        comme les autres.
                                    </span>
                                </Modal.Heading>
                                <Modal.CloseTrigger />
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-3">
                                {apercu ? (
                                    <div className="rounded-xl border border-separator bg-surface-secondary p-3 text-sm">
                                        <p className="font-semibold text-foreground">
                                            {apercu.nomEtablissement}
                                        </p>
                                        <p className="text-muted">
                                            Du {enDate(apercu.debut)} au {enDate(apercu.fin)} —{' '}
                                            {formatMontant(apercu.total)}
                                        </p>
                                    </div>
                                ) : null}
                                <TextField onChange={setReference} value={reference}>
                                    <Label>Référence de la facture papier</Label>
                                    <InputGroup>
                                        <InputGroup.Prefix>
                                            <Store aria-hidden="true" className="size-4" />
                                        </InputGroup.Prefix>
                                        <InputGroup.Input placeholder="Ex. FICHIER-AGHA-0108" />
                                    </InputGroup>
                                    <Description>
                                        Facultatif, pour rapprocher l&apos;ERP et l&apos;ancien fichier
                                    </Description>
                                </TextField>
                                <p className="text-xs text-muted">
                                    Le montant enregistré est celui calculé par l&apos;ERP sur la période :
                                    c&apos;est lui qui fait foi. La référence sert uniquement à retrouver la
                                    facture papier correspondante.
                                </p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onPress={() => setRepriseOuverte(false)} variant="ghost">
                                    Annuler
                                </Button>
                                <Button
                                    isPending={reprendre.isPending}
                                    onPress={lancerReprise}
                                    variant="primary"
                                >
                                    Enregistrer la reprise
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}
