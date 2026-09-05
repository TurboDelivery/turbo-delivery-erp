import Image from 'next/image';

import { Card } from '@heroui-v3/react';
import { LivreurDetail } from '@/types/livreur';
import { createUrlFile } from '@/utils/createUrlFile';
import { CreneauID } from '@/types/creneau-byId';
import RetourButton from '../../retourButton';


interface props {
    user: LivreurDetail,
    dataCreneau: CreneauID[] | null,
    exerianceLivreur: string
}

function User({ user, dataCreneau, exerianceLivreur }: props) {

    if (!user) {
        return (
            <div>
                <RetourButton />
                <h2>EREUR 404</h2>
            </div>)
    }

    return (
        <div className="flex gap-4 mb-6 ">
            <Card className="relative h-24 w-24 overflow-hidden">
                <Image
                    alt="Photo de profil"
                    className="object-cover"
                    fill
                    src={createUrlFile(user?.avatarUrl ?? '', 'backend')}
                />
            </Card>
            <div className="flex justify-between grow">
                <div className="w-1/3 flex flex-col gap-2 border-r px-6 border-black">
                    <div className=" flex justify-between">
                        <span>Nom</span>
                        <span>{user.prenoms} {user.nom}</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>Id</span>
                        <span className=' max-w-[120px] overflow-x-auto text-nowrap'>{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Inscription</span>
                        <span className=' max-w-[120px] overflow-x-auto text-nowrap'>{user.birthDay}</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>Debut du créneau</span>
                        <span>{''}</span>
                    </div>
                </div>

                <div className="w-1/3 flex flex-col gap-2 border-r px-6 border-black">
                    <div className=" flex justify-between">
                        <span>Type de Turboy</span>
                        <span>{user.type}</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>Expériance </span>
                        <span>{exerianceLivreur}</span>
                    </div>

                    <div className=" flex justify-between">
                        <span>...</span>
                        <span>...</span>
                    </div>

                    <div className=" flex justify-between">
                        <span>immatriculation</span>
                        <span className='max-w-[120px] overflow-x-auto text-nowrap'>{user.immatriculation}</span>
                    </div>
                </div>

                <div className="w-1/3 flex flex-col gap-2 px-6 ">
                    <div className="flex justify-between">
                        <span>Contacts</span>
                        <span>{user.telephone}</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>E-mail</span>
                        <span className=' max-w-[200px] overflow-x-auto text-nowrap'>{user.email}</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>...</span>
                        <span>...</span>
                    </div>
                    <div className=" flex justify-between">
                        <span>Adresse</span>
                        <span className=' max-w-[120px] overflow-x-auto text-nowrap'>{user.habitation}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default User
