'use client';

import { Button, Card, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { flexRender, getCoreRowModel, type RowSelectionState, useReactTable } from '@tanstack/react-table';
import React from 'react';

import { CourierCard } from '@/features/men/components/courier-card';
import { getMenColumns } from '@/features/men/components/men-columns';
import type { ITurboy } from '@/features/turboys/types/turboys.types';

/**
 * Le banc des coursiers.
 *
 * <p>Il monte le VRAI tableau — les mêmes colonnes, la même instance TanStack, le même
 * `Table` de la bibliothèque — et les vraies cartes, sur des données d'exemple. Seule la
 * lecture réseau est remplacée.</p>
 */

const NOMS: [string, string][] = [
    ['Azo', 'OTE'], ['Albert Rene', 'KOHI'], ['Moussa', 'DIABATE'], ['Salif', 'KONE'],
    ['Kouassi', 'YAO'], ['Ibrahim', 'TRAORE'], ['Adama', 'BAMBA'], ['Seydou', 'COULIBALY'],
];

const QUARTIERS = ['Cocody Angré', 'Yopougon Niangon', 'Marcory Zone 4', 'Abobo Baoulé', 'Treichville'];
const TYPES = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT', 'INCONNU'] as const;
/** Les quatre états d'assignation, plus l'absence de valeur. */
const ASSIGNATIONS = ['TURBO', 'FREE', 'WAITING', null];
/** null = étape 1 d'inscription (aucune action), 2 = en attente, 3 = validé, 4 = actif, 5 = inactif. */
const STATUTS = [4, 3, 2, 5, 0, null];

function fabriquer(graine: number, nb: number): ITurboy[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    return Array.from({ length: nb }).map((_, i) => {
        const [prenoms, nom] = NOMS[i % NOMS.length];
        return {
            avatarUrl: null,
            avenantUrls: null,
            birthDay: null,
            cniUrlR: null,
            cniUrlV: null,
            commission: suivant() < 0.15 ? null : 55 + Math.round(suivant() * 10),
            contratUrl: null,
            deleted: false,
            email: suivant() < 0.2 ? null : `${prenoms.split(' ')[0].toLowerCase()}.${nom.toLowerCase()}@turbo.ci`,
            ficheIdentificationUrl: null,
            gender: 'HOMME',
            habitation: suivant() < 0.12 ? null : QUARTIERS[i % QUARTIERS.length],
            id: `t${graine}-${i}`,
            immatriculation: null,
            matricule: `TB${1000 + i}`,
            nom,
            nomVehicule: null,
            numeroCni: null,
            prenoms,
            salaire: suivant() < 0.3 ? undefined : 90000 + Math.round(suivant() * 60000),
            status: STATUTS[i % STATUTS.length],
            telephone: `07 0${i % 10} ${10 + i} ${20 + i} ${30 + i}`,
            telephoneCompte: null,
            type: ASSIGNATIONS[i % ASSIGNATIONS.length],
            typeDocument: null,
            typeLivreur: TYPES[i % TYPES.length],
            typeVehicule: null,
            vehiclePhotoUrl: null,
        } as unknown as ITurboy;
    });
}

const JEUX = {
    ordinaire: { libelle: 'Flotte ordinaire', lignes: fabriquer(11, 10) },
    lacunaire: { libelle: 'Dossiers incomplets', lignes: fabriquer(43, 8) },
    vide: { libelle: 'Aucun coursier', lignes: [] as ITurboy[] },
};

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
    const [sombre, setSombre] = React.useState(false);
    React.useEffect(() => {
        const html = document.documentElement;
        const avant = html.className;
        html.className = sombre ? 'dark' : 'light';
        return () => {
            html.className = avant;
        };
    }, [sombre]);
    return [sombre, setSombre];
}

export default function ApercuCoursiers() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [vue, setVue] = React.useState<'grid' | 'list'>('list');
    const [sombre, setSombre] = useThemeSombre();
    const [coches, setCoches] = React.useState<RowSelectionState>({});

    const lignes = JEUX[jeu].lignes;
    const colonnes = React.useMemo(() => getMenColumns([]), []);
    const table = useReactTable({
        columns: colonnes,
        data: lignes,
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
        manualPagination: true,
        onRowSelectionChange: setCoches,
        state: { rowSelection: coches },
    });

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Coursiers</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main className="mx-auto flex max-w-[1600px] flex-col gap-4 p-4">
                    <ToggleButtonGroup
                        onSelectionChange={(s) => {
                            const v = Array.from(s)[0];
                            if (v) setVue(String(v) as 'grid' | 'list');
                        }}
                        selectedKeys={new Set([vue])}
                        selectionMode="single"
                    >
                        <ToggleButton id="grid">En grille</ToggleButton>
                        <ToggleButton id="list">En liste</ToggleButton>
                    </ToggleButtonGroup>

                    {vue === 'list' ? (
                        <Card>
                            <Card.Content className="p-0">
                                <Table>
                                    <Table.ScrollContainer>
                                        <Table.Content
                                            aria-label="Tableau des coursiers"
                                            className="min-w-[64rem]"
                                        >
                                            <Table.Header>
                                                {table.getFlatHeaders().map((header) => (
                                                    <Table.Column
                                                        id={header.id}
                                                        isRowHeader={header.id === 'prenoms'}
                                                        key={header.id}
                                                    >
                                                        {header.isPlaceholder
                                                            ? ''
                                                            : flexRender(
                                                                  header.column.columnDef.header,
                                                                  header.getContext(),
                                                              )}
                                                    </Table.Column>
                                                ))}
                                            </Table.Header>
                                            <Table.Body
                                                renderEmptyState={() => (
                                                    <p className="py-8 text-center text-sm text-muted">
                                                        Aucun coursier à afficher.
                                                    </p>
                                                )}
                                            >
                                                {table.getRowModel().rows.map((row) => (
                                                    <Table.Row id={row.id} key={row.id}>
                                                        {row.getVisibleCells().map((cell) => (
                                                            <Table.Cell key={cell.id}>
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext(),
                                                                )}
                                                            </Table.Cell>
                                                        ))}
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Content>
                                    </Table.ScrollContainer>
                                </Table>
                            </Card.Content>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {lignes.map((t) => (
                                <CourierCard key={t.id} turboy={t} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
