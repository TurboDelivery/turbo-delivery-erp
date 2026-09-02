'use client';

import { useActionState } from 'react';

import { Button, FieldError, Input, Label, Spinner, TextField } from '@heroui-v3/react';
import { IconLock, IconUser } from '@tabler/icons-react';
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
 */
export function FormLogin() {
    const router = useRouter();
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

            <TextField isRequired fullWidth name="password" type="password" isInvalid={echec}>
                <Label>Mot de passe</Label>
                <div className="relative">
                    <IconLock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <Input autoComplete="current-password" className="w-full pl-10" placeholder="Votre mot de passe" />
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
