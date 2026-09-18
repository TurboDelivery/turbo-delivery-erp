'use client';

import { ShieldAlert } from 'lucide-react';
import React from 'react';

import { TitreSection } from '@/components/commons/TitreSection';
import { ChampMotDePasse, ChampTexte } from '@/components/commons/champs-formulaire';

/**
 * Le compte du partenaire — identifiant de connexion et mot de passe.
 *
 * <p>Ce composant existait en DEUX exemplaires identiques caractère pour caractère,
 * `ComptePartenaireSection` sous `create/` et `CompteSection` sous `edit/` : deux endroits
 * à corriger le jour où l'un des deux bougeait. Les deux formulaires montent le même.</p>
 *
 * <h3>Ce que « Nom utilisateur » cachait</h3>
 * <p>Ce champ ne porte pas un nom : il porte l'IDENTIFIANT DE CONNEXION, et le serveur le
 * range dans la colonne `email` du compte partenaire. Cette valeur sert deux fois, à se
 * connecter et à recevoir le lien de « mot de passe oublié ». Le libellé « Nom utilisateur »
 * appelait un nom, et c'est ce qu'on lui a donné : au 18/09/2026, six partenaires de
 * production se connectent avec `ADMIN`, `YANNICK`, `KFC - PALMERAIE`, `cafefneich`,
 * `chickenyop`, `lunionlab2`. Aucun d'eux ne peut récupérer son mot de passe, et rien ne
 * le disait.</p>
 *
 * <h3>Pourquoi le navigateur ne doit pas y toucher</h3>
 * <p>Un champ texte suivi d'un champ mot de passe, c'est un formulaire de connexion aux
 * yeux de Chrome, qui y verse les identifiants de la personne CONNECTÉE. Ces valeurs
 * partent ensuite au serveur à l'enregistrement. Ouvrir une fiche et cliquer sur
 * Enregistrer suffisait donc à donner ses propres identifiants au partenaire.</p>
 *
 * <h3>L'état du compte est dit, pas deviné</h3>
 * <p>Un partenaire peut n'avoir AUCUN compte : le serveur ne le créait que si les deux
 * champs étaient remplis, et se taisait sinon. Quatre établissements de production sont
 * dans ce cas. L'écran l'annonce désormais au lieu de laisser croire à un accès.</p>
 *
 * <p>L'identifiant lui-même n'est volontairement pas affiché : la route qui sert la fiche
 * est ouverte sans jeton, et publier les identifiants de connexion offrirait de quoi
 * verrouiller les comptes partenaires, qui se bloquent au bout de trois tentatives.</p>
 */
interface ComptePartenaireSectionProps {
  /**
   * Le partenaire a-t-il déjà un compte de connexion ?
   * `undefined` à la création, où la question ne se pose pas encore.
   */
  compteExistant?: boolean | null;
  onPasswordChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  password: string;
  username: string;
}

export function ComptePartenaireSection({
  compteExistant,
  onPasswordChange,
  onUsernameChange,
  password,
  username,
}: ComptePartenaireSectionProps) {
  // Trois états, et non deux : à la CRÉATION, il n'y a pas encore de partenaire, donc
  // aucun identifiant « actuel » à conserver. Écrire le contraire serait faux, et c'est
  // ce que le banc a montré avant que cet écran ne parte.
  const sansCompte = compteExistant === false;
  const creation = compteExistant == null;

  const aideIdentifiant = creation
    ? "Le partenaire se connectera avec cette adresse, et c'est là qu'il recevra son lien de réinitialisation."
    : sansCompte
      ? "C'est avec elle que le partenaire se connectera, et qu'il recevra son lien de réinitialisation."
      : "Vide, l'identifiant actuel du partenaire est conservé.";

  const aideMotDePasse = creation
    ? 'Les deux champs vont ensemble : tous les deux pour ouvrir un accès, aucun des deux pour créer le partenaire sans compte.'
    : sansCompte
      ? 'Obligatoire pour créer le compte.'
      : 'Vide, le mot de passe actuel est conservé. Rempli, il le remplace.';

  return (
    <section>
      <TitreSection>Compte du partenaire</TitreSection>

      {sansCompte && (
        <p
          className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-soft-foreground"
          role="status"
        >
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Ce partenaire n&apos;a aucun compte de connexion. Il ne peut ni ouvrir son
            espace, ni demander un nouveau mot de passe. Renseignez les deux champs
            ci-dessous pour lui en créer un.
          </span>
        </p>
      )}

      {/*
        Pas de bandeau quand le compte existe. Un message permanent qui répète que tout va
        bien cesse d'être lu, et c'est le jour où il change de texte que personne ne le
        voit : c'est le raisonnement déjà tenu par `AvertissementListeTronquee`. Ce qu'il
        faut savoir dans ce cas tient sous les champs, à l'endroit où on les remplit.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChampTexte
          aide={aideIdentifiant}
          autoComplete="off"
          label="Identifiant de connexion (adresse e-mail)"
          onChange={onUsernameChange}
          placeholder="contact@etablissement.com"
          type="email"
          valeur={username}
        />
        <ChampMotDePasse
          aide={aideMotDePasse}
          autoComplete="new-password"
          label="Mot de passe"
          onChange={onPasswordChange}
          valeur={password}
        />
      </div>
    </section>
  );
}

/** Nom historique de ce composant sur le formulaire d'édition. */
export const CompteSection = ComptePartenaireSection;
