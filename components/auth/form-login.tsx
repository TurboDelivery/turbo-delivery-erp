'use client';

import { useActionState, useState } from 'react';

import { Button, FieldError, Input, Label, Spinner, TextField } from '@heroui-v3/react';
import { IconEye, IconEyeOff, IconLock, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { loginUser } from '@/src/actions/users.actions';

import { FormChangePassword } from './form-change-password';

/**
 * Formulaire de connexion, reconstruit sur HeroUI v3.
 *
 * <p>Il etait fait d'`<input className="form-input">` bruts, avec les icones posees en
 * absolu et un `<label>` sans lien avec son champ : aucun composant de bibliotheque, donc
 * aucun etat gere — ni focus visible, ni invalidite, ni message d'erreur rattache au champ
 * pour un lecteur d'ecran. Le seul style venait d'une classe utilitaire dont le fond
 * disparaissait selon la version de Tailwind.</p>
 *
 * <p>`TextField` porte desormais l'etat, `Label` est lie au champ, `FieldError` annonce
 * l'echec a l'endroit ou il s'est produit, et `Button` gere son propre etat d'envoi. Les
 * icones passent par `InputGroup`-like : elles restent en absolu faute d'equivalent v3,
 * mais le champ reserve leur place par son padding plutot que de les superposer au texte.</p>
 *
 * <h3>L'oeil</h3>
 * <p>Tous les autres champs de mot de passe de l'ERP en ont un, par `ChampMotDePasse` :
 * celui-ci, le premier que l'on rencontre, n'en avait pas. On tapait a l'aveugle un mot de
 * passe provisoire du genre « uL9_imA8 », et une faute de frappe ne se distinguait pas
 * d'un mauvais mot de passe — au troisieme essai le compte se verrouille.</p>
 *
 * <p>Le bouton porte un nom qui dit ce qu'il VA faire, et le champ lui reserve sa place a
 * droite par son padding, comme le cadenas a gauche. Le type du champ bascule, si bien que
 * le gestionnaire de mots de passe continue de reconnaitre le champ dans les deux etats.</p>
 */
export function FormLogin() {
    const router = useRouter();
    const [motDePasseVisible, setMotDePasseVisible] = useState(false);
    const [state, formAction, enCours] = useActionState(
        async (_: any, formData: FormData) => {
            const result = await loginUser(formData);

            if (
                result.status === 'error' &&
                result?.data?.user?.changePassword === false &&
                result?.data?.user?.username != ''
            ) {
                toast.error(result.message);

                return {
                    data: { changePassword: result?.data?.user?.changePassword, username: result?.data?.user?.username },
                    message: '',
                    errors: {},
                    status: 'idle',
                    code: undefined,
                };
            }

            if (result.status === 'success') {
                toast.success(result.message);
                router.push('/');
                return result;
            }

            // Le message reste porte par l'etat pour etre affiche DANS le formulaire :
            // un toast disparait, et l'operateur qui revient sur l'ecran ne sait plus
            // pourquoi sa connexion a echoue.
            toast.error('Identifiants incorrects');
            return {
                data: { changePassword: true, username: '' },
                message: 'Identifiants incorrects',
                errors: {},
                status: 'idle',
                code: undefined,
            };
        },
        { data: { changePassword: true, username: undefined }, message: '', errors: {}, status: 'idle', code: undefined },
    );

    const echec = state.status === 'idle' && Boolean(state.message);

    if (!state.data?.changePassword) {
        return <FormChangePassword userName={state.data?.username} />;
    }

    return (
        <form action={formAction} className="flex flex-col gap-5">
            <TextField isRequired fullWidth name="username" isInvalid={echec}>
                <Label>Nom d&apos;utilisateur</Label>
                <div className="relative">
                    <IconUser
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <Input autoComplete="username" className="w-full pl-10" placeholder="Votre identifiant" />
                </div>
            </TextField>

            <TextField
                fullWidth
                isInvalid={echec}
                isRequired
                name="password"
                type={motDePasseVisible ? 'text' : 'password'}
            >
                <Label>Mot de passe</Label>
                <div className="relative">
                    <IconLock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <Input
                        autoComplete="current-password"
                        className="w-full pl-10 pr-11"
                        placeholder="Votre mot de passe"
                    />
                    {/* Le nom dit ce que le bouton VA faire, pas l'etat courant : un lecteur
                        d'ecran annonce « Afficher le mot de passe », on l'active, il annonce
                        « Masquer ». `type="button"` est implicite sur `Button` de la v3, mais
                        ce bouton vit DANS un formulaire : sans lui il le soumettrait. */}
                    <Button
                        aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        isIconOnly
                        onPress={() => setMotDePasseVisible((v) => !v)}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        {motDePasseVisible ? (
                            <IconEyeOff aria-hidden="true" className="size-5" />
                        ) : (
                            <IconEye aria-hidden="true" className="size-5" />
                        )}
                    </Button>
                </div>
                {/* L'echec s'affiche ICI, rattache au champ, et non plus seulement dans un
                    toast qui s'efface avant que l'operateur ait fini de lire. */}
                {echec && <FieldError>{state.message}</FieldError>}
            </TextField>

            <Button fullWidth isPending={enCours} type="submit" className="mt-1 uppercase">
                {({ isPending }: { isPending: boolean }) => (
                    <>
                        {isPending && <Spinner color="current" size="sm" />}
                        {isPending ? 'Connexion…' : 'Je me connecte'}
                    </>
                )}
            </Button>
        </form>
    );
}
