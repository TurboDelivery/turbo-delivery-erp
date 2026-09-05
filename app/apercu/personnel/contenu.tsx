'use client';

import { Button, Card, Table } from '@heroui-v3/react';
import React from 'react';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import {
  ChipStatutDeduction,
  ChipTypeDeduction,
} from '@/components/personnel/deductions/deductions/chips-deduction';
import { ChipStatutEmploye } from '@/components/personnel/employee-table/employee-columns';
import {
  PersonnelMobileCard,
  PersonnelMobileCardList,
} from '@/components/personnel/shared/personnel-mobile-card';
import { AgentCell } from '@/features/personnel/components/shared/agent-cell';
import {
  DeclarationChip,
  EtatMoisChip,
  GraviteChip,
  StatutEffectifChip,
  TypeContratChip,
} from '@/features/personnel/components/shared/personnel-chips';
import {
  DeductionStatusEnum,
  DeductionTypeEnum,
} from '@/features/personnel/types/deduction.types';
import type { EtatDeclaration } from '@/features/personnel/types/personnel-historisation.types';

/**
 * Le banc du module Personnel.
 *
 * <p>Il monte les VRAIES pastilles et les VRAIS champs du module — contrat, effectif,
 * déclaration, gravité, état du mois, type et statut de déduction, statut d'employé — et
 * la cellule d'identité d'agent. C'est là que se voit ce qu'a changé la refonte : les
 * catégories perdent leur teinte, les états gardent la leur, et les trois bibliothèques
 * de champs deviennent une.</p>
 */

const TYPES_CONTRAT = ['CDI', 'CDD', 'PRESTATAIRE', 'JOURNALIER', 'INDEPENDANT', 'STAGIAIRE'];
const DECLARATIONS: EtatDeclaration[] = [
  'DECLARE',
  'NON_DECLARE',
  'INCONNU',
  'NON_APPLICABLE',
];
const GRAVITES = ['CRITIQUE', 'A_TRAITER', 'A_VERIFIER'];
const STATUTS_EMPLOYE = ['Actif', 'Inactif', 'Congé'] as const;

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

function Section({ children, titre }: { children: React.ReactNode; titre: string }) {
  return (
    <Card>
      <Card.Header>
        <span className="text-sm font-semibold text-foreground">{titre}</span>
      </Card.Header>
      <Card.Content className="flex-row flex-wrap items-center gap-2">{children}</Card.Content>
    </Card>
  );
}

const COLONNES = ['Agent', 'Contrat', 'Effectif', 'Déclaration'] as const;

export default function ApercuPersonnel() {
  const [sombre, setSombre] = useThemeSombre();
  const [texte, setTexte] = React.useState('Azo OTE');
  const [montant, setMontant] = React.useState<number | undefined>(150000);
  const [date, setDate] = React.useState('2026-03-17');
  const [liste, setListe] = React.useState('CDI');
  const [note, setNote] = React.useState('');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
        <span className="font-bold tracking-wider uppercase">Aperçu · Personnel</span>
        <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
          {sombre ? 'sombre' : 'clair'}
        </Button>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Le vocabulaire du module</h1>
          <p className="text-sm text-muted">
            Ce qui garde une couleur la garde parce qu&apos;elle dit un état. Les catégories
            passent au neutre.
          </p>
        </div>

        <Section titre="Type de contrat — une catégorie, donc neutre">
          {TYPES_CONTRAT.map((t) => (
            <TypeContratChip key={t} type={t} />
          ))}
        </Section>

        <Section titre="Effectif — un état">
          <StatutEffectifChip actif />
          <StatutEffectifChip actif={false} sortieLe="2026-05-12" />
          <StatutEffectifChip actif={false} />
        </Section>

        <Section titre="Déclaration — un état, et une exposition légale">
          {DECLARATIONS.map((d) => (
            <DeclarationChip etat={d} key={d} />
          ))}
        </Section>

        <Section titre="Gravité d'anomalie — une échelle">
          {GRAVITES.map((g) => (
            <GraviteChip gravite={g} key={g} />
          ))}
        </Section>

        <Section titre="Mois de paie">
          <EtatMoisChip statut="CLOTURE" />
          <EtatMoisChip statut="OUVERT" />
        </Section>

        <Section titre="Statut d'employé">
          {STATUTS_EMPLOYE.map((s) => (
            <ChipStatutEmploye key={s} statut={s} />
          ))}
        </Section>

        <Section titre="Déduction — type (catégorie) puis statut (état)">
          {Object.values(DeductionTypeEnum).map((t) => (
            <ChipTypeDeduction key={t} type={t} />
          ))}
          <span className="w-full" />
          {Object.values(DeductionStatusEnum).map((s) => (
            <ChipStatutDeduction key={s} statut={s} />
          ))}
        </Section>

        <div>
          <h2 className="text-lg font-bold text-foreground">La cellule d&apos;identité</h2>
          <p className="text-sm text-muted">
            Même rendu dans l&apos;effectif, les contrats, les anomalies et la masse salariale.
          </p>
        </div>

        <Card>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Agents" className="min-w-[48rem]">
                  <Table.Header>
                    {COLONNES.map((c) => (
                      <Table.Column id={c} isRowHeader={c === 'Agent'} key={c}>
                        {c}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {[
                      { d: 'DECLARE' as EtatDeclaration, m: 'TB1042', n: 'Azo OTE', t: 'CDI' },
                      {
                        d: 'NON_DECLARE' as EtatDeclaration,
                        m: 'TB0871',
                        n: 'Mariam Diarra',
                        t: 'CDD',
                      },
                      {
                        d: 'NON_APPLICABLE' as EtatDeclaration,
                        m: null,
                        n: 'Koffi Adama',
                        t: 'JOURNALIER',
                      },
                    ].map((a) => (
                      <Table.Row id={a.n} key={a.n}>
                        <Table.Cell>
                          <AgentCell
                            matricule={a.m}
                            nom={a.n}
                            sousTitre="Agent de la centrale d'appel · Cocody"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <TypeContratChip type={a.t} />
                        </Table.Cell>
                        <Table.Cell>
                          <StatutEffectifChip actif={a.t !== 'JOURNALIER'} sortieLe="2026-05-12" />
                        </Table.Cell>
                        <Table.Cell>
                          <DeclarationChip etat={a.d} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground">Les champs des fenêtres</h2>
          <p className="text-sm text-muted">
            Trois bibliothèques — un `Label` shadcn, un `Input` v2 et un `&lt;small&gt;` rouge —
            deviennent un champ qui porte son erreur.
          </p>
        </div>

        <Card>
          <Card.Content className="gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ChampTexte
                label="Nom complet"
                onChange={setTexte}
                placeholder="Entrez le nom"
                valeur={texte}
              />
              <ChampTexte
                erreur="L'adresse est invalide."
                label="Email (en erreur)"
                onChange={() => undefined}
                placeholder="Entrez l'email"
                type="email"
                valeur="pas-une-adresse"
              />
              <ChampMontant
                aide="En francs CFA"
                label="Salaire"
                onChange={setMontant}
                valeur={montant}
              />
              <ChampTexte label="Date d'entrée" onChange={setDate} type="date" valeur={date} />
              <ChampListe
                label="Type de contrat"
                onChange={setListe}
                options={TYPES_CONTRAT.map((t) => ({ label: t, value: t }))}
                placeholder="Rechercher un type"
                valeur={liste}
              />
            </div>
            <ChampZoneTexte
              label="Motif"
              onChange={setNote}
              placeholder="Saisissez le motif"
              valeur={note}
            />
          </Card.Content>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground">Cartes tactiles</h2>
          <p className="text-sm text-muted">Ce que voit un gestionnaire sous 768 px.</p>
        </div>
        <div className="max-w-sm [&>div]:block">
          <PersonnelMobileCardList>
            <PersonnelMobileCard
              actions={
                <Button className="w-full" variant="primary">
                  Payer
                </Button>
              }
              fields={[
                { label: 'Poste', value: "Agent de la centrale d'appel" },
                { label: 'Département', value: 'OPERATIONS' },
                { label: 'Salaire', value: '150 000 F CFA' },
              ]}
              statut={<ChipStatutEmploye statut="Actif" />}
              subtitle="azo.ote@turbo.ci"
              title="Azo OTE"
            />
            <PersonnelMobileCard
              fields={[
                { label: 'Type', value: <ChipTypeDeduction type={DeductionTypeEnum.PRET} /> },
                { label: 'Montant', value: '45 000 F CFA' },
              ]}
              statut={<ChipStatutDeduction statut={DeductionStatusEnum.CANCELLED} />}
              subtitle="mariam.diarra@turbo.ci"
              title="Mariam Diarra"
            />
          </PersonnelMobileCardList>
        </div>
      </main>
    </div>
  );
}
