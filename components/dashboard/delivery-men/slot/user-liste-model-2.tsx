import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image, Avatar } from '@/components/heroui';
// import DropDownAction from './dropDownAction';
// import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';
import progresseBare from '../progression/progression-barre';
import DropDownAction from './dropDownAction';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatDate } from '@/utils/date-formate';
function UserListeModel2({ turboy }: any) {
    return (
        <Card className="max-w-[400px] rounded-md">
            <CardHeader className="flex justify-between gap-3">
                <div className='flex gap-2 items-center'>
                    <Avatar isBordered radius="full" size="md" src={turboy?.avatar ? createUrlFile(turboy?.avatar ?? '', "backend") : 'assets/images/avatar.png'} />
                    <p className="text-md">{turboy.nomComplet}</p>
                </div>

                <DropDownAction id={turboy.id} />
            </CardHeader>
            <CardBody className='flex flex-col gap-2'>
                <p className="w-1/2 text-sm text-gray-500">Inscrit le : {turboy.dateInscrit ? formatDate(turboy.dateInscrit, 'DD/MM/YYYY') : '-'}</p>
                <p className="text-sm text-gray-500 mr-3">Défini le : {turboy.dateDefiniEmploiTemps ? formatDate(turboy.dateDefiniEmploiTemps, 'DD/MM/YYYY') : '-'}</p>

            </CardBody>
            <CardFooter>
                <div className="flex gap-2 w-full">
                    {progresseBare(turboy)}
                    <span className='relative mt-5  '>
                        {turboy.disponibilite ? <IconPointFilled style={{ border: 'none' }} color="#16B84E" size={30} /> : <IconPointFilled style={{ border: 'none' }} color="#FF0000" size={30} />}
                        {turboy.disponibilite ? <span className="absolute -top-[3px] inline-flex h-full w-full animate-ping  rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span> : ''}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
};

export default UserListeModel2;
