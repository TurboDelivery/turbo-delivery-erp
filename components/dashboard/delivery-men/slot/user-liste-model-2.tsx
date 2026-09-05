import { Avatar, Card } from '@heroui-v3/react';
// import DropDownAction from './dropDownAction';
// import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';
import progresseBare from '../progression/progression-barre';
import DropDownAction from './dropDownAction';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatDate } from '@/utils/date-formate';
function UserListeModel2({ turboy }: any) {
    return (
        <Card className="max-w-[400px]">
            <Card.Header className="flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Avatar size="md">
                        <Avatar.Image alt="" src={turboy?.avatar ? createUrlFile(turboy?.avatar ?? '', 'backend') : 'assets/images/avatar.png'} />
                        <Avatar.Fallback>{(turboy.nomComplet ?? '?').slice(0, 2).toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                    <p className="text-sm font-medium text-foreground">{turboy.nomComplet}</p>
                </div>
                <DropDownAction id={turboy.id} />
            </Card.Header>
            <Card.Content className="gap-2">
                <p className="text-sm text-muted">
                    Inscrit le : {turboy.dateInscrit ? formatDate(turboy.dateInscrit, 'DD/MM/YYYY') : '-'}
                </p>
                <p className="text-sm text-muted">
                    Défini le :{' '}
                    {turboy.dateDefiniEmploiTemps ? formatDate(turboy.dateDefiniEmploiTemps, 'DD/MM/YYYY') : '-'}
                </p>
            </Card.Content>
            <Card.Footer>
                <div className="flex w-full items-center gap-2">
                    {progresseBare(turboy)}
                    {/* Deux hexadecimaux ecrits en dur — `#16B84E` et `#FF0000` — qui ne
                        suivent aucun theme. */}
                    <span className="relative flex items-center">
                        <IconPointFilled
                            className={turboy.disponibilite ? 'text-success' : 'text-danger'}
                            size={30}
                        />
                        {turboy.disponibilite ? (
                            <span className="absolute inset-0 inline-flex animate-ping rounded-full bg-success/50 opacity-75" />
                        ) : null}
                    </span>
                </div>
            </Card.Footer>
        </Card>
    );
};

export default UserListeModel2;
