'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Chip, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import React from 'react';
import { useForm } from 'react-hook-form';

import { SectionAvenantsCommission } from '@/app/(protected)/delivery-men/men/[id]/_components/section-avenants-commission';
import { SectionCompte } from '@/app/(protected)/delivery-men/men/[id]/_components/section-compte';
import { SectionDocumentIdentite } from '@/app/(protected)/delivery-men/men/[id]/_components/section-document-identite';
import { SectionInfosPersonnelles } from '@/app/(protected)/delivery-men/men/[id]/_components/section-infos-personnelles';
import { SectionPhotoProfil } from '@/app/(protected)/delivery-men/men/[id]/_components/section-photo-profil';
import { SectionVehicule } from '@/app/(protected)/delivery-men/men/[id]/_components/section-vehicule';
import { StatusChip } from '@/features/men/components/status-chip';
import {
    type UpdateTurboyInfoDTO,
    updateTurboyInfoSchema,
} from '@/features/turboys/schemas/update-turboy-info.schema';

/**
 * Le banc des sections du formulaire de la fiche coursier.
 *
 * <p>Il monte les VRAIES sections, sur une instance `react-hook-form` réelle : c'est là
 * que se voient les icônes qui ont remplacé les émojis, le sélecteur de date, les listes
 * cherchables et le champ numérique de commission.</p>
 */

const VALEURS_PLEINES: UpdateTurboyInfoDTO = {
    birthDay: '1994-03-17',
    commission: 60,
    email: 'ote.azo@turbo.ci',
    habitation: 'Cocody Angré 7e tranche',
    immatriculation: 'CI2837AB',
    nom: 'OTE',
    nomVehicule: 'KTML 31',
    numeroCni: 'CI0038271902',
    numeroPersonneAContacter: '+225 0708091011',
    permisConduire: true,
    prenoms: 'Azo',
    telephone: '+225 0102030405',
    telephoneCompte: '0930000300',
    typeDocument: 'CNI',
    typeVehicule: 'MOTO',
} as UpdateTurboyInfoDTO;

const VALEURS_VIDES: UpdateTurboyInfoDTO = {
    birthDay: '',
    commission: undefined,
    email: '',
    habitation: '',
    immatriculation: '',
    nom: '',
    nomVehicule: '',
    numeroCni: '',
    numeroPersonneAContacter: '',
    permisConduire: false,
    prenoms: '',
    telephone: '',
    telephoneCompte: '',
    typeDocument: '',
    typeVehicule: '',
} as UpdateTurboyInfoDTO;

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

export default function ApercuFicheCoursier() {
    const [sombre, setSombre] = useThemeSombre();
    const [rempli, setRempli] = React.useState(true);
    const [onglet, setOnglet] = React.useState('profil');
    const [avenants, setAvenants] = React.useState<File[]>([]);
    const [cniFiles, setCniFiles] = React.useState<File[]>([]);
    const [vehiculeFile, setVehiculeFile] = React.useState<File | null>(null);
    const [contratFile, setContratFile] = React.useState<File | null>(null);
    const [ficheFile, setFicheFile] = React.useState<File | null>(null);

    const {
        control,
        formState: { errors },
        reset,
        trigger,
    } = useForm<UpdateTurboyInfoDTO>({
        defaultValues: VALEURS_PLEINES,
        resolver: zodResolver(updateTurboyInfoSchema),
    });

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Fiche coursier</span>
                    <Button
                        onPress={() => {
                            setRempli(true);
                            reset(VALEURS_PLEINES);
                        }}
                        size="sm"
                        variant={rempli ? 'primary' : 'ghost'}
                    >
                        Dossier complet
                    </Button>
                    <Button
                        onPress={() => {
                            setRempli(false);
                            reset(VALEURS_VIDES);
                        }}
                        size="sm"
                        variant={rempli ? 'ghost' : 'primary'}
                    >
                        Dossier vide
                    </Button>
                    <Button onPress={() => void trigger()} size="sm" variant="outline">
                        Montrer les erreurs
                    </Button>
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main className="mx-auto flex max-w-[1100px] flex-col gap-6 p-4">
                    {/* L'en-tête d'identité, dans la même forme que la fiche réelle. */}
                    <Card>
                        <Card.Content className="flex-row flex-wrap items-center gap-4">
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-2xl font-bold text-foreground">Azo OTE</h1>
                                <p className="text-sm text-muted">TB1042 · +225 0102030405</p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Chip size="sm" variant="soft">
                                        <Chip.Label>Journalier</Chip.Label>
                                    </Chip>
                                    <StatusChip status={4} />
                                    <Chip color="success" size="sm" variant="soft">
                                        <Chip.Label>Assigné</Chip.Label>
                                    </Chip>
                                    <Chip size="sm" variant="soft">
                                        <Chip.Label>Cote 78/100</Chip.Label>
                                    </Chip>
                                </div>
                            </div>
                        </Card.Content>
                    </Card>

                    <ToggleButtonGroup
                        className="flex-wrap"
                        onSelectionChange={(sel) => {
                            const v = Array.from(sel)[0];
                            if (v) setOnglet(String(v));
                        }}
                        selectedKeys={new Set([onglet])}
                        selectionMode="single"
                    >
                        <ToggleButton id="profil">Profil &amp; documents</ToggleButton>
                        <ToggleButton id="habilitation">Habilitation &amp; pièces</ToggleButton>
                        <ToggleButton id="activite">Activité &amp; pointages</ToggleButton>
                    </ToggleButtonGroup>

                    <div className="flex flex-col gap-8" hidden={onglet !== 'profil'}>
                        <SectionPhotoProfil
                            avatarPreview={null}
                            contratFile={contratFile}
                            onAvatarChange={() => undefined}
                            onContratChange={setContratFile}
                            prenom="Azo"
                        />
                        <SectionInfosPersonnelles control={control} errors={errors} />
                        <SectionDocumentIdentite
                            cniFiles={cniFiles}
                            control={control}
                            errors={errors}
                            ficheIdentificationFile={ficheFile}
                            onCniChange={setCniFiles}
                            onFicheIdentificationChange={setFicheFile}
                        />
                        <SectionVehicule
                            control={control}
                            errors={errors}
                            onVehicleChange={setVehiculeFile}
                            vehicleFile={vehiculeFile}
                        />
                        <SectionCompte control={control} errors={errors} />
                        <SectionAvenantsCommission
                            avenantFiles={avenants}
                            control={control}
                            errors={errors}
                            existingAvenants={rempli ? ['avenant-1.pdf', 'avenant-2.jpg'] : null}
                            onAvenantsChange={setAvenants}
                        />
                    </div>

                    <div hidden={onglet !== 'habilitation'}>
                        <p className="py-10 text-center text-sm text-muted">
                            Panneau d’habilitation — non monté sur le banc (il lit le serveur).
                        </p>
                    </div>
                    <div hidden={onglet !== 'activite'}>
                        <p className="py-10 text-center text-sm text-muted">
                            Pointages — non montés sur le banc (ils lisent le serveur).
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
