'use client';

import { Alert, Button, Tabs } from '@heroui-v3/react';
import { Check, Minus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

import { PrivilegesMatrix } from '@/components/privileges/privileges-matrix';
import { PrivilegesReglage } from '@/components/privileges/privileges-reglage';
import {
  aplatirMenu,
  carteDepuis,
  cleDerogation,
  listeDepuis,
  regleDuCode,
  ROLES_TRIES,
  type EtatDerogations,
} from '@/features/privileges/utils/privileges.utils';
import { enregistrerDerogations, type Derogation } from '@/src/privileges/privileges.action';

/**
 * La marque de l'onglet actif.
 *
 * <p>`Tabs.Indicator` de la v3 est inutilisable dans ce projet — il se pose hors du flux et
 * ne suit pas l'onglet. La convention retenue ailleurs (classement des partenaires,
 * validation finance) est un trait sous l'onglet selectionne, et c'est elle qu'on suit.</p>
 */
const MARQUE_ACTIVE =
  'border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold';

/** Les cles dont la valeur differe entre deux etats, d'un cote comme de l'autre. */
function ecarts(reference: EtatDerogations, courant: EtatDerogations): string[] {
  const cles = new Set([...Object.keys(reference), ...Object.keys(courant)]);
  return [...cles].filter((c) => reference[c] !== courant[c]);
}

/**
 * L'ecran des privileges : on regle, on enregistre.
 *
 * <h3>Ce qui est enregistre, et ce qui ne l'est pas</h3>
 * <p>Seul l'ECART avec le code est conserve. Remettre une case sur la valeur que le code
 * lui donne EFFACE la derogation au lieu d'en poser une identique : la table ne retient
 * donc que ce qui a ete decide a la main, et « réglé à la main » veut dire quelque
 * chose.</p>
 *
 * <p>L'enregistrement remplace l'ENSEMBLE des derogations, tous roles confondus. C'est
 * pourquoi l'etat porte ici la table entiere et non le seul role affiche : changer de role
 * en cours de reglage ne perd rien, et deux modifications sur deux roles partent
 * ensemble.</p>
 */
export function PrivilegesEcran({ derogationsInitiales }: { derogationsInitiales: Derogation[] }) {
  const router = useRouter();

  const depart = React.useMemo(() => carteDepuis(derogationsInitiales), [derogationsInitiales]);

  /** L'etat ENREGISTRE. Il n'avance qu'apres une reponse du serveur. */
  const [reference, setReference] = React.useState<EtatDerogations>(depart);
  const [etat, setEtat] = React.useState<EtatDerogations>(depart);
  const [role, setRole] = React.useState<string>(ROLES_TRIES[0]);
  const [enCours, setEnCours] = React.useState(false);

  const lignes = React.useMemo(() => aplatirMenu(), []);
  const modifiees = ecarts(reference, etat);

  const basculer = (roleCible: string, chemin: string, autorise: boolean) => {
    const entree = lignes.find((l) => l.chemin === chemin);
    const defaut = entree ? regleDuCode(roleCible, entree) : null;
    const cle = cleDerogation(roleCible, chemin);

    setEtat((precedent) => {
      const suivant = { ...precedent };
      // Revenir sur la valeur du code n'est pas une derogation : c'est son retrait.
      if (autorise === defaut) delete suivant[cle];
      else suivant[cle] = autorise;
      return suivant;
    });
  };

  const retablirRole = (roleCible: string) => {
    const prefixe = `${roleCible.toUpperCase()}|`;
    setEtat((precedent) =>
      Object.fromEntries(Object.entries(precedent).filter(([c]) => !c.startsWith(prefixe))),
    );
  };

  const enregistrer = async () => {
    setEnCours(true);
    const resultat = await enregistrerDerogations(listeDepuis(etat));
    setEnCours(false);

    if (resultat.status === 'success') {
      setReference(etat);
      toast.success(resultat.message);
      // La barre laterale et la garde d'acces sont rendues par le layout SERVEUR : sans
      // ce rafraichissement, le reglage ne se verrait qu'au prochain chargement complet.
      router.refresh();
    } else {
      toast.error(resultat.message);
    }
  };

  return (
    <div className="space-y-4">
      {/*
        Dit avant le premier geste, et non en note de bas de page. Un ecran de droits qui
        ne tient pas ce qu'il promet est plus dangereux que pas d'ecran du tout : on croit
        l'acces ferme et on cesse de le surveiller.
      */}
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Ce réglage pilote l&apos;affichage, pas l&apos;accès au serveur</Alert.Title>
          <Alert.Description>
            Les contrôleurs de l&apos;API ne vérifient pas le rôle de l&apos;appelant. Fermer
            un écran ici le retire du menu et le refuse à la navigation, mais ne l&apos;interdit
            pas à qui en connaît l&apos;adresse. À utiliser pour cadrer et alléger ce que
            chacun voit, pas pour protéger une donnée sensible.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <Tabs className="w-full" defaultSelectedKey="reglage" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab className={MARQUE_ACTIVE} id="reglage">
              Régler un rôle
            </Tabs.Tab>
            <Tabs.Tab className={MARQUE_ACTIVE} id="ensemble">
              Vue d&apos;ensemble
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="reglage">
          <PrivilegesReglage
            derogations={etat}
            onChange={basculer}
            onRetablirRole={retablirRole}
            onRoleChange={setRole}
            role={role}
          />
        </Tabs.Panel>

        <Tabs.Panel className="space-y-3 pt-4" id="ensemble">
          {/* La legende est ici et pas en tete de page : elle n'explique que les marques
              de cette matrice, et n'a rien a dire sur l'onglet de reglage. */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Check aria-hidden="true" className="size-4 text-success" /> Autorisé
            </span>
            <span className="flex items-center gap-1">
              <X aria-hidden="true" className="size-4 text-muted" /> Refusé
            </span>
            <span className="flex items-center gap-1">
              <Minus aria-hidden="true" className="size-4 text-muted/50" /> Aucune règle dans le code
            </span>
            <span className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="inline-block size-3 rounded-md bg-warning-soft ring-1 ring-warning"
              />
              Réglé à la main
            </span>
          </div>

          <PrivilegesMatrix derogations={etat} />
        </Tabs.Panel>
      </Tabs>

      {/*
       * La barre ne parait que s'il y a quelque chose a enregistrer, et elle colle au bas
       * de la fenetre : la liste des ecrans depasse la hauteur d'un poste (environ 563 px),
       * et un bouton pose en fin de page se serait trouve hors de vue au moment meme ou
       * l'operateur vient de basculer un interrupteur.
       */}
      {modifiees.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-separator bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{modifiees.length}</span> modification
              {modifiees.length > 1 ? 's' : ''} en attente
            </p>
            <div className="flex items-center gap-2">
              <Button isDisabled={enCours} onPress={() => setEtat(reference)} variant="ghost">
                Annuler
              </Button>
              <Button isPending={enCours} onPress={enregistrer} variant="primary">
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
