'use client';

import React from 'react';
import {
  Button,
  Description,
  Input,
  Label,
  Radio,
  RadioGroup,
  Spinner,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import { PhoneOff, Send } from 'lucide-react';

import {
  useQualifierMutation,
  type IAppelSaisi,
  type IFicheClient,
  type Joignabilite,
} from '@/features/bdd-clients';

/**
 * L'appel de qualification, en trois étapes.
 *
 * <h3>L'écran suit la conversation, pas le modèle de données</h3>
 * <p>On décroche, on vérifie qu'on parle à la bonne personne, puis seulement on demande
 * un avis, puis seulement on demande le consentement. Afficher les trois blocs d'emblée
 * ferait remplir un avis sur un appel qui n'a pas abouti. Les étapes deux et trois
 * n'apparaissent donc que si l'étape une a dit « joignable ».</p>
 *
 * <h3>La conséquence est écrite AVANT le clic</h3>
 * <p>Chaque réponse de l'étape une rejette, reporte ou qualifie la fiche. L'agent lit ce
 * que sa réponse va faire pendant qu'il choisit, pas après. Une première version
 * n'affichait la conséquence qu'une fois le choix posé : c'est l'ordre inverse de celui
 * dont on a besoin quand quelqu'un est en ligne.</p>
 *
 * <h3>On tape, on n'ouvre pas de liste</h3>
 * <p>Tout ce qui a moins de six réponses possibles est un groupe de boutons, pas un menu
 * déroulant : un menu coûte deux gestes et masque l'écran pendant qu'il est ouvert. Seuls
 * le prénom et le verbatim restent des champs de saisie, parce qu'ils sont libres.</p>
 *
 * <h3>Ce que l'écran ne décide pas</h3>
 * <p>Le statut de la fiche. Il découle de l'appel, côté serveur : la Nième tentative sans
 * réponse fait « Injoignable » — le seuil est un paramètre du module, l'écran ne le
 * répète pas —, un faux numéro fait « Rejeté », un appel complet fait « Qualifié ».
 * L'écran envoie ce qui s'est passé, il ne pose pas de verdict.</p>
 */

const REPONSES: { cle: Joignabilite; libelle: string; consequence: string }[] = [
  { cle: 'JOIGNABLE', consequence: 'on continue l’appel', libelle: 'Joignable, bon client' },
  {
    cle: 'INJOIGNABLE',
    consequence: 'une tentative de plus, la fiche reste à rappeler',
    libelle: 'Injoignable ou messagerie',
  },
  { cle: 'PAS_LE_BON_CLIENT', consequence: 'la fiche est rejetée', libelle: 'Pas le bon client' },
  { cle: 'FAUX_NUMERO', consequence: 'la fiche est rejetée', libelle: 'Faux numéro' },
];

const EFFICACITE = [
  { cle: 'OUI', libelle: 'Oui' },
  { cle: 'MOYENNEMENT', libelle: 'Moyennement' },
  { cle: 'NON', libelle: 'Non' },
];

const CONSENTEMENT = [
  { cle: 'OUI', libelle: 'Oui' },
  { cle: 'NON', libelle: 'Non' },
  { cle: 'PAS_DEMANDE', libelle: 'Pas demandé' },
];

const CANAUX = [
  { cle: 'APPEL', libelle: 'Appel' },
  { cle: 'WHATSAPP', libelle: 'WhatsApp' },
  { cle: 'SMS', libelle: 'SMS' },
];

const POINTS = [
  'Retard',
  'Commande abîmée ou froide',
  'Attitude du livreur',
  'Erreur de commande',
  'Livreur injoignable',
];

/** Une clé de sélection unique, ou une chaîne vide. Les groupes de ce formulaire sont tous simples. */
function cleUnique(cles: Set<React.Key>): string {
  const premiere = [...cles][0];
  return premiere === undefined ? '' : String(premiere);
}

export function FormulaireQualification({ fiche }: { fiche: IFicheClient }) {
  const qualifier = useQualifierMutation();

  const [joignabilite, setJoignabilite] = React.useState<Joignabilite | null>(null);
  const [efficacite, setEfficacite] = React.useState('');
  const [note, setNote] = React.useState<number | null>(null);
  const [points, setPoints] = React.useState<string[]>([]);
  const [commentaire, setCommentaire] = React.useState('');
  const [consentement, setConsentement] = React.useState('');
  const [canal, setCanal] = React.useState('');
  const [prenom, setPrenom] = React.useState('');

  /*
   * La livraison de RÉFÉRENCE : la plus récente. L'avis porte sur elle, et donc sur un
   * partenaire précis — sans lui, la note moyenne par partenaire ne serait pas calculable
   * et le serveur refuse l'appel.
   */
  const reference = fiche.captures[0];

  const abouti = joignabilite === 'JOIGNABLE';
  const complet =
    joignabilite !== null &&
    (!abouti || (efficacite !== '' && note !== null && consentement !== '' && Boolean(reference)));

  const envoyer = () => {
    if (!joignabilite || !complet) return;
    const appel: IAppelSaisi = abouti
      ? {
          avisEfficacite: efficacite,
          canalPrefere: canal || null,
          commentaire: commentaire.trim() || null,
          consentement,
          joignabilite,
          note,
          partenaireAvisId: reference?.partenaireId ?? null,
          pointsSignales: points,
          prenom: prenom.trim() || null,
        }
      : { joignabilite };

    qualifier.mutate(
      { appel, clientId: fiche.id },
      {
        onSuccess: () => {
          setJoignabilite(null);
          setEfficacite('');
          setNote(null);
          setPoints([]);
          setCommentaire('');
          setConsentement('');
          setCanal('');
          setPrenom('');
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-large border border-separator bg-surface-2 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Appeler</h3>
        {fiche.tentativesAppel > 0 ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <PhoneOff aria-hidden="true" className="size-3.5" />
            <span className="tabular-nums">{fiche.tentativesAppel}</span> tentative
            {fiche.tentativesAppel > 1 ? 's' : ''} sans réponse
          </span>
        ) : null}
      </div>

      {/*
        Quatre réponses exclusives : une liste de choix, pas quatre boutons en drapeau.
        Chacune porte sa conséquence, lisible pendant qu'on choisit.
      */}
      <RadioGroup
        className="gap-1.5"
        onChange={(v) => setJoignabilite(v as Joignabilite)}
        value={joignabilite ?? ''}
        variant="secondary"
      >
        <Label className="text-sm font-normal text-foreground">Le numéro est-il bon ?</Label>
        {REPONSES.map((r) => (
          <Radio key={r.cle} value={r.cle}>
            <Radio.Content className="items-start gap-2">
              <Radio.Control className="mt-0.5">
                <Radio.Indicator />
              </Radio.Control>
              <span className="flex flex-col">
                <span className="text-sm text-foreground">{r.libelle}</span>
                <Description className="text-xs">{r.consequence}</Description>
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>

      {/* Les étapes deux et trois n'existent que si le client a répondu. */}
      {abouti ? (
        <>
          <div className="flex flex-col gap-3 border-t border-separator pt-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">La livraison a-t-elle été efficace ?</span>
              {reference ? (
                <span className="text-xs text-muted">
                  l&apos;avis porte sur la dernière commande, chez {reference.partenaire}
                </span>
              ) : (
                <span className="text-xs text-danger-soft-foreground">
                  Aucune commande sur cette fiche : l&apos;avis ne peut être rattaché à aucun
                  restaurant, et le serveur refusera la qualification.
                </span>
              )}
            </div>

            <ToggleButtonGroup
              aria-label="Efficacité de la livraison"
              fullWidth
              onSelectionChange={(k) => setEfficacite(cleUnique(k))}
              selectedKeys={efficacite ? [efficacite] : []}
              selectionMode="single"
              size="sm"
            >
              {EFFICACITE.map((e, i) => (
                <ToggleButton id={e.cle} key={e.cle}>
                  {i > 0 ? <ToggleButtonGroup.Separator /> : null}
                  {e.libelle}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">
                Note sur 5 <span className="text-xs text-muted">(1 très mauvais, 5 très bon)</span>
              </span>
              <ToggleButtonGroup
                aria-label="Note du client"
                fullWidth
                onSelectionChange={(k) => {
                  const choix = cleUnique(k);
                  setNote(choix === '' ? null : Number(choix));
                }}
                selectedKeys={note === null ? [] : [String(note)]}
                selectionMode="single"
                size="sm"
              >
                {[1, 2, 3, 4, 5].map((n, i) => (
                  <ToggleButton className="tabular-nums" id={String(n)} key={n}>
                    {i > 0 ? <ToggleButtonGroup.Separator /> : null}
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">
                Ce qui n&apos;a pas marché <span className="text-xs text-muted">(facultatif)</span>
              </span>
              <ToggleButtonGroup
                aria-label="Points signalés par le client"
                className="flex-wrap justify-start"
                isDetached
                onSelectionChange={(k) => setPoints([...k].map(String))}
                selectedKeys={points}
                selectionMode="multiple"
                size="sm"
              >
                {POINTS.map((p) => (
                  <ToggleButton id={p} key={p}>
                    {p}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>

            <TextField onChange={setCommentaire} value={commentaire}>
              <Label>Ce que le client dit</Label>
              <Input placeholder="Facultatif, dans ses mots" />
            </TextField>
          </div>

          <div className="flex flex-col gap-3 border-t border-separator pt-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">Accepte d&apos;être recontacté</span>
              <ToggleButtonGroup
                aria-label="Consentement à être recontacté"
                fullWidth
                onSelectionChange={(k) => setConsentement(cleUnique(k))}
                selectedKeys={consentement ? [consentement] : []}
                selectionMode="single"
                size="sm"
              >
                {CONSENTEMENT.map((c, i) => (
                  <ToggleButton id={c.cle} key={c.cle}>
                    {i > 0 ? <ToggleButtonGroup.Separator /> : null}
                    {c.libelle}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>

            {/* Le canal ne se demande que si le client a dit oui : le demander sinon
                laisserait croire qu'on va s'en servir. */}
            {consentement === 'OUI' ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  Par quel canal <span className="text-xs text-muted">(facultatif)</span>
                </span>
                <ToggleButtonGroup
                  aria-label="Canal de recontact préféré"
                  fullWidth
                  onSelectionChange={(k) => setCanal(cleUnique(k))}
                  selectedKeys={canal ? [canal] : []}
                  selectionMode="single"
                  size="sm"
                >
                  {CANAUX.map((c, i) => (
                    <ToggleButton id={c.cle} key={c.cle}>
                      {i > 0 ? <ToggleButtonGroup.Separator /> : null}
                      {c.libelle}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>
            ) : null}

            <TextField onChange={setPrenom} value={prenom}>
              <Label>Prénom</Label>
              <Input placeholder="Facultatif, s'il le donne" />
            </TextField>
          </div>
        </>
      ) : null}

      {/*
        « Qualifié » exige les trois étapes. Le bouton le dit avant le clic plutôt que de
        laisser le serveur refuser : l'agent est au téléphone, il n'a pas le temps de lire
        un message d'erreur.
      */}
      <div className="flex items-center justify-between gap-2 border-t border-separator pt-3">
        <span className="text-xs text-muted">
          {joignabilite === null
            ? 'Commence par dire si le numéro est bon.'
            : abouti && !complet
              ? 'Il manque l’avis, la note ou le consentement.'
              : ''}
        </span>
        <Button isDisabled={!complet || qualifier.isPending} onPress={envoyer} variant="primary">
          {qualifier.isPending ? (
            <Spinner size="sm" />
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
          Enregistrer l&apos;appel
        </Button>
      </div>
    </section>
  );
}
