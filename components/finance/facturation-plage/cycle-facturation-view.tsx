'use client';

import {
    Button,
    Card,
    Chip,
    ComboBox,
    Input,
    InputGroup,
    ListBox,
    Spinner,
    Table,
    TextField,
    Tooltip,
} from '@heroui-v3/react';
import { CalendarRange, Info, RotateCcw, Search, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
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

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
    { id: 'partenaire', label: 'Partenaire' },
    { id: 'cycle', label: 'Cycle de facturation' },
    { id: 'objet', label: 'Objet de la facture' },
    { id: 'statut', label: 'Statut' },
    { id: 'actions', label: '' },
] as const;

export function CycleFacturationView() {
    const { data, isError, isFetching, isLoading, refetch } = useConfigurationFacturationQuery();
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
                dto: {
                    cycleFacturation: patch.cycle !== undefined ? patch.cycle : partenaire.cycleChoisi,
                    objetFacturation:
                        patch.objet !== undefined
                            ? patch.objet
                            : partenaire.objetFacturation === 'GLOBALE'
                              ? null
                              : partenaire.objetFacturation,
                },
                restaurantId: partenaire.restaurantId,
            },
            { onSettled: () => setLigneEnCours(null) },
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-24">
                <Spinner />
                <p className="text-sm text-muted">Chargement des partenaires…</p>
            </div>
        );
    }

    // Sans cette sortie, un echec affichait un tableau vide : lu comme « aucun partenaire
    // a configurer », alors que la liste existe et n'a pas pu etre relue.
    if (isError) {
        return (
            <div className="p-4">
                <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les partenaires" />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Configuration cycle de facturation partenaire
                    </h1>
                    <p className="text-sm text-muted">
                        Un seul endroit pour définir comment chaque partenaire est facturé.
                    </p>
                </div>
                <LienBouton href="/finance/facturation-plage" variante="outline">
                    <CalendarRange aria-hidden="true" className="size-4" />
                    Facturer un partenaire
                </LienBouton>
            </div>

            <Card>
                <Card.Content className="flex-row items-start gap-2 text-sm text-muted">
                    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                    <div>
                        <p>
                            Un partenaire non modifié ici continue de fonctionner exactement comme
                            aujourd&apos;hui, sur son cycle historique. Rien n&apos;est migré
                            automatiquement.
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            {nbConfigures} partenaire{nbConfigures > 1 ? 's' : ''} sur{' '}
                            {(data ?? []).length} {nbConfigures > 1 ? 'ont' : 'a'} un cycle défini dans
                            cet écran.
                        </p>
                    </div>
                </Card.Content>
            </Card>

            <Card>
                <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Settings2 aria-hidden="true" className="size-4 text-muted" />
                        {partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''}
                    </div>
                    <TextField
                        aria-label="Rechercher un établissement"
                        className="max-w-xs"
                        onChange={setRecherche}
                        value={recherche}
                    >
                        <InputGroup>
                            <InputGroup.Prefix>
                                <Search aria-hidden="true" className="size-4" />
                            </InputGroup.Prefix>
                            <InputGroup.Input placeholder="Rechercher un établissement" />
                        </InputGroup>
                    </TextField>
                </Card.Header>
                <Card.Content className="p-0">
                    <Table>
                        <Table.ScrollContainer>
                            <Table.Content
                                aria-label="Cycle de facturation par partenaire"
                                className="min-w-[56rem]"
                            >
                                <Table.Header>
                                    {COLONNES.map((c) => (
                                        <Table.Column
                                            id={c.id}
                                            isRowHeader={c.id === 'partenaire'}
                                            key={c.id}
                                        >
                                            {c.label}
                                        </Table.Column>
                                    ))}
                                </Table.Header>
                                <Table.Body
                                    renderEmptyState={() => (
                                        <p className="py-8 text-center text-sm text-muted">
                                            Aucun partenaire ne correspond à cette recherche.
                                        </p>
                                    )}
                                >
                                    {partenaires.map((p) => {
                                        const enCours =
                                            ligneEnCours === p.restaurantId && enregistrer.isPending;
                                        const cycleAffiche = (p.cycleChoisi ??
                                            p.cycleHistorique ??
                                            '') as CycleFacturation;
                                        const cyclesOfferts = CYCLES_FACTURATION.filter(
                                            // On laisse l'option visible si le partenaire y est deja, sinon
                                            // sa ligne afficherait une case vide.
                                            (c) =>
                                                c !== 'AU_CHOIX' ||
                                                peutPoserAuChoix ||
                                                cycleAffiche === 'AU_CHOIX',
                                        ).map((c) => ({ id: c, label: LIBELLE_CYCLE[c] }));
                                        const objets = OBJETS_FACTURATION.map((o) => ({
                                            id: o,
                                            label: LIBELLE_OBJET[o],
                                        }));
                                        return (
                                            <Table.Row id={p.restaurantId} key={p.restaurantId}>
                                                <Table.Cell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {p.nomEtablissement}
                                                        </span>
                                                        {!p.actif ? (
                                                            <span className="text-xs text-muted">
                                                                Établissement inactif
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <ComboBox
                                                        aria-label={`Cycle de ${p.nomEtablissement}`}
                                                        className="max-w-[230px]"
                                                        isDisabled={enCours}
                                                        onSelectionChange={(k) => {
                                                            const choix = String(k ?? '') as CycleFacturation;
                                                            if (!choix || choix === p.cycleChoisi) return;
                                                            appliquer(p, { cycle: choix });
                                                        }}
                                                        selectedKey={cycleAffiche || null}
                                                    >
                                                        <ComboBox.InputGroup>
                                                            <Input />
                                                            <ComboBox.Trigger />
                                                        </ComboBox.InputGroup>
                                                        <ComboBox.Popover>
                                                            <ListBox items={cyclesOfferts}>
                                                                {(o: { id: string; label: string }) => (
                                                                    <ListBox.Item id={o.id} textValue={o.label}>
                                                                        {o.label}
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                )}
                                                            </ListBox>
                                                        </ComboBox.Popover>
                                                    </ComboBox>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <ComboBox
                                                        aria-label={`Objet de facturation de ${p.nomEtablissement}`}
                                                        className="max-w-[260px]"
                                                        isDisabled={enCours}
                                                        onSelectionChange={(k) => {
                                                            const choix = String(k ?? '') as ObjetFacturation;
                                                            if (!choix || choix === p.objetFacturation) return;
                                                            appliquer(p, {
                                                                objet: choix === 'GLOBALE' ? null : choix,
                                                            });
                                                        }}
                                                        selectedKey={p.objetFacturation}
                                                    >
                                                        <ComboBox.InputGroup>
                                                            <Input />
                                                            <ComboBox.Trigger />
                                                        </ComboBox.InputGroup>
                                                        <ComboBox.Popover>
                                                            <ListBox items={objets}>
                                                                {(o: { id: string; label: string }) => (
                                                                    <ListBox.Item id={o.id} textValue={o.label}>
                                                                        {o.label}
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                )}
                                                            </ListBox>
                                                        </ComboBox.Popover>
                                                    </ComboBox>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {p.surCycleParDefaut ? (
                                                        <Tooltip>
                                                            <Chip size="sm" variant="soft">
                                                                <Chip.Label>Par défaut</Chip.Label>
                                                            </Chip>
                                                            <Tooltip.Content>
                                                                Suit son cycle historique (
                                                                {LIBELLE_CYCLE[
                                                                    (p.cycleHistorique ?? '') as CycleFacturation
                                                                ] ??
                                                                    p.cycleHistorique ??
                                                                    'non défini'}
                                                                )
                                                            </Tooltip.Content>
                                                        </Tooltip>
                                                    ) : (
                                                        <Chip size="sm" variant="primary">
                                                            <Chip.Label>Configuré</Chip.Label>
                                                        </Chip>
                                                    )}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {enCours ? (
                                                        <Spinner size="sm" />
                                                    ) : !p.surCycleParDefaut ? (
                                                        <Tooltip>
                                                            <Button
                                                                aria-label="Remettre par défaut"
                                                                isIconOnly
                                                                onPress={() => appliquer(p, { cycle: null })}
                                                                size="sm"
                                                                variant="ghost"
                                                            >
                                                                <RotateCcw aria-hidden="true" className="size-4" />
                                                            </Button>
                                                            <Tooltip.Content>
                                                                Remettre ce partenaire sur son cycle historique
                                                            </Tooltip.Content>
                                                        </Tooltip>
                                                    ) : null}
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table.Content>
                        </Table.ScrollContainer>
                    </Table>
                </Card.Content>
            </Card>

            <p className="text-xs text-muted">
                « Plage de dates » et « Au choix à chaque facture » suspendent la génération
                automatique : les factures de ces partenaires se produisent depuis l&apos;écran
                « Facturation partenaire », par créneau hebdomadaire ou sur une plage librement
                définie. Les quatre autres cycles restent générés chaque nuit, sans changement.
            </p>
        </div>
    );
}
