import UserProfile from '@/components/dashboard/settings/profile/profile';
import { getProfile } from '@/src/actions/users.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Utilisateurs',
};

export default async function Users() {
    const user = await getProfile();
    if (!user) redirect('/auth');;
    return (
        <UserProfile user={user} />
    );
}
