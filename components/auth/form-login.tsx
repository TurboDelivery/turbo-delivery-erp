'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/ui/form-ui/submit-button';

import { loginUser } from '@/src/actions/users.actions';
import { toast } from 'sonner';
import { _loginSchema } from '@/src/schemas/users.schema';
import { useRouter } from 'next/navigation';
import { IconLock, IconUser } from '@tabler/icons-react';
import { FormChangePassword } from './form-change-password';

export function FormLogin() {
    const router = useRouter();
    const [state, formAction] = useActionState(
        async (_: any, formData: FormData) => {
            const result = await loginUser(formData);

            // console.log("Data:", JSON.stringify(result?.data, null, 2))

            if (result.status === 'error'  
                    && result?.data?.user?.changePassword === false 
                    && result?.data?.user?.username != '') {
                toast.error(result.message);

                return {
                    data: { changePassword: result?.data?.user?.changePassword, username: result?.data?.user?.username },
                    message: '', errors: {}, status: 'idle', code: undefined,
                };
            }

            if (result.status === 'success') {
                toast.success(result.message);
                router.push('/');
                return result;
            }
            
            toast.error("Identifiants Incorrects");
            return {
                data: { changePassword: true, username: '' },
                message: 'Identifiants Incorrects', errors: {}, status: 'idle', code: undefined,
            };
        },
        { data: { changePassword: true, username: undefined }, message: '', errors: {}, status: 'idle', code: undefined }
    );


    return (
        <>
            {!state.data?.changePassword ? (
                <FormChangePassword userName={state.data?.username} />
            ) : (  
                <form className="space-y-5 dark:text-white" action={formAction}>
                    <div>
                        <label htmlFor="username">Nom Utilisateur</label>
                        <div className="relative">
                            <input id="username" name="username" type="text" required placeholder="Username" className="form-input ps-10" />
                            <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                <IconUser />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="Password">Mot de Passe</label>
                        <div className="relative text-black">
                            <input
                                id="Password"
                                name="password"
                                type="password"
                                required
                                placeholder="Enter Password"
                                className="form-input ps-10 placeholder:text-gray-500"
                            />
                            <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                <IconLock />
                            </span>
                        </div>
                    </div>

                    <SubmitButton>Je me connecte</SubmitButton>
                </form>
            )}
        </>
    );
}
