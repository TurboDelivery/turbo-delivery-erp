'use client';

import React from 'react';
import { toast } from 'sonner';

/**
 * Poser un mot de passe temporaire à un coursier qui ne peut plus entrer du tout.
 *
 * <h3>Pourquoi ce geste existe</h3>
 * <p>Un compte ouvert puis validé depuis l'ERP n'a ni code ni mot de passe. Pour poser
 * son code, le serveur exige une preuve que le coursier détient son numéro, et la seule
 * preuve qu'il sache produire arrive par SMS. Le compte Twilio étant révoqué, plus aucun
 * SMS ne part : depuis cette révocation, aucun compte dans cet état ne peut poser son
 * code. Ce n'est pas un coursier bloqué, c'est l'ouverture de compte et la récupération
 * entières. «&nbsp;Effacer le code&nbsp;» fabrique même cet état, puisqu'il efface aussi
 * le mot de passe.</p>
 *
 * <h3>⚠ Pourquoi un relais Next, et pas `apiClientHttp`</h3>
 * <p>La route backend est FERMÉE — elle écrit un identifiant — et ne s'ouvre qu'à une clé
 * de service que le navigateur ne doit jamais voir. L'appel part donc vers un
 * gestionnaire de route Next qui tourne côté serveur, vérifie la session, et ajoute la
 * clé. C'est aussi lui qui nomme l'auteur dans l'historique du compte, à partir de la
 * session vérifiée plutôt que d'un en-tête que l'appelant remplirait.</p>
 *
 * <p>Le hook vit à part parce que DEUX fiches coursier portent ce geste. Trois fiches
 * coexistent dans ce dépôt, et la précédente a mis des mois à voir arriver un recours
 * qui existait déjà ailleurs.</p>
 */
export interface MotDePasseTemporaire {
  motDePasse: string;
  expireLe: string;
}

export function useReouvertureAcces(livreurId: string) {
  const [enCours, setEnCours] = React.useState(false);
  const [motDePasse, setMotDePasse] = React.useState<MotDePasseTemporaire | null>(null);

  const rouvrir = React.useCallback(async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const reponse = await fetch(`/api/acces-livreur/${livreurId}/mot-de-passe-temporaire`, {
        method: 'POST',
      });
      const donnees = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        /*
         * ⚠ Le message du SERVEUR, jamais un message générique. Il distingue trois
         * refus qui appellent trois suites différentes : le compte a déjà un code (il
         * faut l'effacer d'abord), le compte a déjà un vrai mot de passe (il n'est pas
         * bloqué), ou la clé de service n'est pas configurée (c'est une panne
         * d'installation, pas un refus métier).
         */
        toast.error(donnees?.message ?? "La réouverture n'a pas abouti.");
        return;
      }
      setMotDePasse({ expireLe: donnees.expireLe, motDePasse: donnees.motDePasse });
    } catch {
      toast.error("La réouverture n'a pas abouti.");
    } finally {
      setEnCours(false);
    }
  }, [enCours, livreurId]);

  const expiration = motDePasse ? new Date(motDePasse.expireLe) : null;
  const expirationLisible =
    expiration && !Number.isNaN(expiration.getTime())
      ? expiration.toLocaleString('fr-FR')
      : (motDePasse?.expireLe ?? '');

  return {
    effacer: () => setMotDePasse(null),
    enCours,
    expirationLisible,
    motDePasse,
    rouvrir,
  };
}
