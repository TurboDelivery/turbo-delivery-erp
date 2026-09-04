'use client';

import {
    Alert,
    Button,
    Calendar,
    Card,
    Chip,
    ComboBox,
    DateField,
    DatePicker,
    DateRangePicker,
    Dropdown,
    Input,
    Label,
    ListBox,
    Modal,
    NumberField,
    RangeCalendar,
    SearchField,
    Separator,
    Skeleton,
    Spinner,
    Switch,
    Tabs,
    TextArea,
    TextField,
    TimeField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, Time, type DateValue } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Une instance de chaque composant, avec l'anatomie que le projet emploie.
 *
 * <p>Le but n'est pas de documenter la bibliotheque : c'est de FAIRE RENDRE chaque
 * composant, pour qu'une anatomie fautive tombe ici plutot que sur un ecran de travail.
 * Chaque bloc est isole dans sa propre limite d'erreur : un composant qui leve n'emporte
 * pas les autres, et on lit d'un coup d'oeil lequel a echoue.</p>
 */

const OPTIONS = [
    { value: 'a', label: 'OTE Azo' },
    { value: 'b', label: 'KOHI Albert Rene' },
    { value: 'c', label: 'ZONE 3 (Limite feu de Bernabé) | ÉGLISE MÉTHODISTE' },
];

/**
 * Attrape ce qui leve DANS un bloc, sans emporter la page.
 *
 * <p>Une limite d'erreur ne peut s'ecrire qu'en classe : React n'expose
 * `componentDidCatch` a aucun equivalent fonctionnel.</p>
 */
class Bloc extends React.Component<
    { titre: string; children: React.ReactNode },
    { erreur: Error | null }
> {
    state: { erreur: Error | null } = { erreur: null };

    static getDerivedStateFromError(erreur: Error) {
        return { erreur };
    }

    render() {
        const { titre, children } = this.props;
        const { erreur } = this.state;
        return (
            <section
                className={cn(
                    'flex flex-col gap-3 rounded-xl border p-4',
                    erreur ? 'border-danger/40 bg-danger-soft' : 'border-separator bg-surface',
                )}
            >
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{titre}</h2>
                {erreur ? (
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-danger-soft-foreground">
                            Ce composant lève au rendu.
                        </p>
                        <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-danger-soft-foreground">
                            {erreur.message}
                        </p>
                    </div>
                ) : (
                    children
                )}
            </section>
        );
    }
}

export default function GalerieComposants() {
    const [sombre, setSombre] = React.useState(false);
    const [modalOuvert, setModalOuvert] = React.useState(false);
    const [onglet, setOnglet] = React.useState('un');
    const [coche, setCoche] = React.useState(true);
    const [texte, setTexte] = React.useState('');
    const [nombre, setNombre] = React.useState(1500);
    const [cle, setCle] = React.useState<string | null>('a');
    const [bascule, setBascule] = React.useState(new Set(['mois']));
    const [date, setDate] = React.useState<DateValue | null>(new CalendarDate(2026, 9, 4));
    const [plage, setPlage] = React.useState<{ start: DateValue; end: DateValue } | null>({
        start: new CalendarDate(2026, 9, 1),
        end: new CalendarDate(2026, 9, 30),
    });
    const [heure, setHeure] = React.useState<Time | null>(new Time(19, 22));

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-3 border-b border-separator px-4 py-3">
                    <h1 className="text-sm font-bold">Galerie des composants</h1>
                    <p className="text-xs text-muted">
                        Une instance de chaque composant employé par le projet. Un bloc rouge signale
                        un composant qui lève au rendu.
                    </p>
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    <Bloc titre="Button">
                        <div className="flex flex-wrap gap-2">
                            <Button variant="primary">Primaire</Button>
                            <Button variant="secondary">Secondaire</Button>
                            <Button variant="tertiary">Tertiaire</Button>
                            <Button variant="outline">Contour</Button>
                            <Button variant="ghost">Fantôme</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="danger-soft">Danger doux</Button>
                            <Button isDisabled>Désactivé</Button>
                            <Button isPending>
                                <Spinner color="current" size="sm" />
                                En cours
                            </Button>
                            <Button aria-label="Supprimer" isIconOnly variant="danger-soft">
                                <Trash2 aria-hidden="true" className="size-4" />
                            </Button>
                        </div>
                    </Bloc>

                    <Bloc titre="Chip">
                        <div className="flex flex-wrap gap-2">
                            <Chip variant="primary">Primaire</Chip>
                            <Chip variant="secondary">Secondaire</Chip>
                            <Chip variant="tertiary">Tertiaire</Chip>
                            <Chip variant="soft">Doux</Chip>
                        </div>
                    </Bloc>

                    <Bloc titre="Tabs">
                        <Tabs onSelectionChange={(c) => setOnglet(String(c))} selectedKey={onglet}>
                            <Tabs.List>
                                <Tabs.Tab id="un">Premier</Tabs.Tab>
                                <Tabs.Tab id="deux">Second</Tabs.Tab>
                            </Tabs.List>
                        </Tabs>
                        <p className="text-xs text-muted">Onglet actif : {onglet}</p>
                    </Bloc>

                    {/*
                     * L'indicateur est isole EXPRES : c'est lui qui a fait tomber la page
                     * Tickets en production. Si un jour la bibliotheque le rend utilisable
                     * sans conteneur d'animation, ce bloc cessera d'etre rouge et on le saura.
                     */}
                    <Bloc titre="Tabs.Indicator (piège connu)">
                        <Tabs defaultSelectedKey="un">
                            <Tabs.List>
                                <Tabs.Tab id="un">Premier</Tabs.Tab>
                                <Tabs.Tab id="deux">Second</Tabs.Tab>
                                <Tabs.Indicator />
                            </Tabs.List>
                        </Tabs>
                    </Bloc>

                    <Bloc titre="Modal">
                        <Modal isOpen={modalOuvert} onOpenChange={setModalOuvert}>
                            <Button onPress={() => setModalOuvert(true)} variant="outline">
                                Ouvrir la fenêtre
                            </Button>
                            <Modal.Backdrop>
                                <Modal.Container>
                                    <Modal.Dialog>
                                        <Modal.Header>
                                            <Modal.Heading>Confirmer la suppression</Modal.Heading>
                                        </Modal.Header>
                                        <Modal.Body>
                                            <p className="text-sm">
                                                Cette action est irréversible. Confirmez-vous ?
                                            </p>
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Modal.CloseTrigger>
                                                <Button variant="ghost">Annuler</Button>
                                            </Modal.CloseTrigger>
                                            <Button variant="danger">Supprimer</Button>
                                        </Modal.Footer>
                                    </Modal.Dialog>
                                </Modal.Container>
                            </Modal.Backdrop>
                        </Modal>
                    </Bloc>

                    <Bloc titre="Dropdown">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <Button variant="outline">
                                    <Download aria-hidden="true" className="size-4" />
                                    Exporter
                                </Button>
                            </Dropdown.Trigger>
                            <Dropdown.Popover>
                                <Dropdown.Menu aria-label="Format d'export">
                                    <Dropdown.Item id="pdf">PDF</Dropdown.Item>
                                    <Dropdown.Item id="excel">Excel</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </Bloc>

                    <Bloc titre="Switch">
                        <Switch isSelected={coche} onChange={setCoche}>
                            <Switch.Content>
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch.Content>
                        </Switch>
                        <p className="text-xs text-muted">{coche ? 'activé' : 'désactivé'}</p>
                    </Bloc>

                    <Bloc titre="Alert">
                        <Alert status="warning">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Action critique</Alert.Title>
                                <Alert.Description>
                                    Ce geste déclenche des virements réels et ne se défait pas.
                                </Alert.Description>
                            </Alert.Content>
                        </Alert>
                    </Bloc>

                    <Bloc titre="SearchField">
                        <SearchField fullWidth onChange={setTexte} value={texte}>
                            <Label>Code check</Label>
                            <SearchField.Group>
                                <SearchField.SearchIcon />
                                <SearchField.Input placeholder="Rechercher…" />
                                <SearchField.ClearButton />
                            </SearchField.Group>
                        </SearchField>
                    </Bloc>

                    <Bloc titre="TextField">
                        <TextField onChange={setTexte} value={texte}>
                            <Label>Libellé</Label>
                            <Input placeholder="Saisir…" />
                        </TextField>
                    </Bloc>

                    {/*
                     * `TextArea` n'est PAS composite : il n'expose que `Root`, et son
                     * `onChange` recoit un evenement DOM, pas une valeur — contrairement a
                     * `TextField` et `SearchField` juste au-dessus, qui recoivent la valeur.
                     * L'incoherence est dans la bibliotheque ; la noter ici evite de la
                     * redecouvrir a chaque usage.
                     */}
                    <Bloc titre="TextArea">
                        <div className="flex flex-col gap-1">
                            <Label>Motif</Label>
                            <TextArea
                                onChange={(e) => setTexte(e.target.value)}
                                placeholder="Expliquer le motif…"
                                value={texte}
                            />
                        </div>
                    </Bloc>

                    <Bloc titre="NumberField">
                        <NumberField minValue={0} onChange={setNombre} value={nombre}>
                            <Label>Montant</Label>
                            <NumberField.Group>
                                <NumberField.DecrementButton />
                                <NumberField.Input />
                                <NumberField.IncrementButton />
                            </NumberField.Group>
                        </NumberField>
                    </Bloc>

                    <Bloc titre="ComboBox (liste filtrable)">
                        <ComboBox onSelectionChange={(c) => setCle(c ? String(c) : null)} selectedKey={cle}>
                            <Label>Livreur</Label>
                            <ComboBox.InputGroup>
                                <Input placeholder="Rechercher…" />
                                <ComboBox.Trigger />
                            </ComboBox.InputGroup>
                            <ComboBox.Popover>
                                <ListBox items={OPTIONS}>
                                    {(o: (typeof OPTIONS)[number]) => (
                                        <ListBox.Item id={o.value} textValue={o.label}>
                                            {o.label}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    )}
                                </ListBox>
                            </ComboBox.Popover>
                        </ComboBox>
                    </Bloc>

                    <Bloc titre="DatePicker + Calendar">
                        <DatePicker onChange={setDate} value={date}>
                            <Label>Date</Label>
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
                                            {(j: string) => <Calendar.HeaderCell>{j}</Calendar.HeaderCell>}
                                        </Calendar.GridHeader>
                                        <Calendar.GridBody>
                                            {(d: CalendarDate) => <Calendar.Cell date={d} />}
                                        </Calendar.GridBody>
                                    </Calendar.Grid>
                                </Calendar>
                            </DatePicker.Popover>
                        </DatePicker>
                    </Bloc>

                    <Bloc titre="DateRangePicker + RangeCalendar">
                        <DateRangePicker onChange={setPlage} value={plage}>
                            <Label>Période</Label>
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
                                <RangeCalendar>
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
                                            {(j: string) => <RangeCalendar.HeaderCell>{j}</RangeCalendar.HeaderCell>}
                                        </RangeCalendar.GridHeader>
                                        <RangeCalendar.GridBody>
                                            {(d: CalendarDate) => <RangeCalendar.Cell date={d} />}
                                        </RangeCalendar.GridBody>
                                    </RangeCalendar.Grid>
                                </RangeCalendar>
                            </DateRangePicker.Popover>
                        </DateRangePicker>
                    </Bloc>

                    <Bloc titre="TimeField">
                        <TimeField onChange={setHeure} value={heure}>
                            <Label>Heure</Label>
                            <TimeField.Group>
                                <TimeField.Input>
                                    {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                                        <TimeField.Segment segment={segment} />
                                    )}
                                </TimeField.Input>
                            </TimeField.Group>
                        </TimeField>
                    </Bloc>

                    <Bloc titre="ToggleButtonGroup">
                        <ToggleButtonGroup
                            onSelectionChange={(s) => setBascule(new Set(Array.from(s).map(String)))}
                            selectedKeys={bascule}
                            selectionMode="single"
                        >
                            <ToggleButton id="mois">Ce mois</ToggleButton>
                            <ToggleButton id="annee">Cette année</ToggleButton>
                        </ToggleButtonGroup>
                    </Bloc>

                    <Bloc titre="Tooltip">
                        <div className="flex gap-3">
                            <Tooltip>
                                <Button variant="outline">Survolez-moi</Button>
                                <Tooltip.Content>Une info-bulle</Tooltip.Content>
                            </Tooltip>
                            {/* Un declencheur DESACTIVE n'emet ni survol ni focus : sans
                                `Tooltip.Trigger`, l'info-bulle ne s'ouvrirait jamais. */}
                            <Tooltip>
                                <Tooltip.Trigger>
                                    <Button isDisabled variant="outline">
                                        Désactivé
                                    </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Le motif du blocage</Tooltip.Content>
                            </Tooltip>
                        </div>
                    </Bloc>

                    <Bloc titre="Card">
                        <Card>
                            <Card.Header>
                                <Card.Title>Titre de la carte</Card.Title>
                                <Card.Description>Une description.</Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <p className="text-sm">Le contenu.</p>
                            </Card.Content>
                        </Card>
                    </Bloc>

                    <Bloc titre="Skeleton, Spinner, Separator">
                        <Skeleton className="h-4 w-40" />
                        <Separator />
                        <div className="flex items-center gap-3">
                            <Spinner size="sm" />
                            <Spinner />
                        </div>
                    </Bloc>

                    <Bloc titre="Jetons de couleur">
                        {/*
                         * MESURES : en texte sur une carte claire, `text-warning` rend 2,04:1,
                         * `text-success` 2,19 et `text-danger` 3,57, pour un seuil de 4,5. Ce
                         * sont des couleurs de REMPLISSAGE. Les variantes `-soft-foreground`
                         * rendent 5,72 / 5,49 / 6,74 et conviennent au texte.
                         */}
                        <div className="flex flex-col gap-1 text-sm">
                            <span className="text-foreground">text-foreground</span>
                            <span className="text-muted">text-muted</span>
                            <span className="text-accent">text-accent</span>
                            <span className="text-success-soft-foreground">text-success-soft-foreground</span>
                            <span className="text-warning-soft-foreground">text-warning-soft-foreground</span>
                            <span className="text-danger-soft-foreground">text-danger-soft-foreground</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['bg-surface', 'bg-surface-secondary', 'bg-surface-tertiary', 'bg-accent-soft', 'bg-success-soft', 'bg-warning-soft', 'bg-danger-soft'].map(
                                (c) => (
                                    <span
                                        className={cn('rounded-md border border-separator px-2 py-1 text-[11px]', c)}
                                        key={c}
                                    >
                                        {c}
                                    </span>
                                ),
                            )}
                        </div>
                    </Bloc>
                </main>
            </div>
        </div>
    );
}
