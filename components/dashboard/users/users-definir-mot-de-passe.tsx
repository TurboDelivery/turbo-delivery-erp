'use client';

import { Alert } from '@heroui-v3/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ChampMotDePasse } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { definirMotDePasseUtilisateur } from '@/src/actions/users.actions';
import { User } from '@/types/models';

/** La règle du serveur, écrite ici pour que l'échec se voie AVANT l'aller-retour. */
const LONGUEUR_MINIMALE = 8;

/**
 * Un administrateur pose un mot de passe CHOISI sur le compte de quelqu'un d'autre.
 *
 * <h3>Pourquoi en plus de la réinitialisation</h3>
 * <p>La réinitialisation tire un mot de passe au hasard. C'est sûr, mais il faut le
 * transmettre tel quel, et « uL9_imA8 » ne se dicte pas au téléphone sans faute. Poser un mot
 * de passe convenu répond au même besoin par un autre geste.</p>
 *
 * <h3>Ce que l'administrateur ne gagne pas</h3>
 * <p>Il ouvre un accès, il ne s'en approprie pas un. Le compte reste marqué « doit changer
 * son mot de passe » : à la première connexion, la personne en choisit un autre, et celui que
 * l'administrateur connaît cesse de fonctionner. C'est la même garantie que la
 * réinitialisation, et c'est ce qui rend ce geste acceptable.</p>
 */
const UsersDefinirMotDePasse = ({
    open,
    setOpen,
    user,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    user: User;
}) => {
    const router = useRouter();
    const [enCours, setEnCours] = useState(false);
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [fait, setFait] = useState(false);

    useEffect(() => {
        // Le mot de passe saisi ne survit pas à la fermeture : rouvrir la fenêtre sur un
        // AUTRE utilisateur le proposerait sinon pour lui.
        if (!open) {
            setMotDePasse('');
            setConfirmation('');
            setEnCours(false);
            setFait(false);
        }
    }, [open]);

    const nom = [user.prenoms, user.nom].filter(Boolean).join(' ') || user.username;

    const tropCourt = motDePasse.length > 0 && motDePasse.length < LONGUEUR_MINIMALE;
    const discordance = confirmation.length > 0 && confirmation !== motDePasse;
    const peutValider = motDePasse.length >= LONGUEUR_MINIMALE && confirmation === motDePasse;

    const definir = async () => {
        if (!peutValider) return;
        setEnCours(true);
        const resultat = await definirMotDePasseUtilisateur(user.id, motDePasse);
        setEnCours(false);

        if (resultat.status === 'success') {
            setFait(true);
            toast.success(resultat.message || 'Mot de passe défini');
            router.refresh();
        } else {
            toast.error(resultat.message || 'Erreur lors de la définition du mot de passe');
        }
    };

    return (
        <FenetreAction
            enAttente={enCours}
            libelleAction={fait ? undefined : 'Définir'}
            libelleFermer={fait ? 'Fermer' : 'Annuler'}
            onAction={definir}
            onFermer={() => setOpen(false)}
            ouvert={open}
            titre={fait ? 'Mot de passe défini' : `Définir le mot de passe de ${nom}`}
        >
            {fait ? (
                <Alert status="success">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Transmettez-le par un canal sûr</Alert.Title>
                        <Alert.Description>
                            {nom} devra choisir son propre mot de passe à sa prochaine connexion :
                            celui que vous venez de poser cessera alors de fonctionner. Son compte a
                            aussi été débloqué si des tentatives infructueuses le retenaient.
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            ) : (
                <>
                    {/* La regle du serveur, dite AVANT la saisie : la decouvrir sur un refus
                        oblige a tout retaper. */}
                    <p className="text-sm text-muted">
                        {LONGUEUR_MINIMALE} caractères au minimum, dont une majuscule, une
                        minuscule, un chiffre et un caractère spécial.
                    </p>
                    <ChampMotDePasse
                        erreur={tropCourt ? `${LONGUEUR_MINIMALE} caractères au minimum` : undefined}
                        estRequis
                        label="Nouveau mot de passe"
                        onChange={setMotDePasse}
                        valeur={motDePasse}
                    />
                    <ChampMotDePasse
                        erreur={discordance ? 'Les deux saisies diffèrent' : undefined}
                        estRequis
                        label="Confirmer"
                        onChange={setConfirmation}
                        valeur={confirmation}
                    />
                    <Alert status="warning">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>
                                Son mot de passe actuel cessera immédiatement de fonctionner
                            </Alert.Title>
                            <Alert.Description>
                                {nom} devra choisir le sien à sa prochaine connexion. Si vous
                                préférez ne pas connaître son mot de passe, utilisez plutôt
                                «&nbsp;Réinitialiser&nbsp;», qui en tire un au hasard.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert>
                </>
            )}
        </FenetreAction>
    );
};

export default UsersDefinirMotDePasse;
