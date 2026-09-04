'use client';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
/*
 * `Popover` de HeroUI v3, a la place du `Dropdown` maison.
 *
 * <p>Le panneau s'affichait TRANSPARENT : son `<ul>` portait `divide-y`, `text-dark` et
 * une ombre, mais aucune classe de fond, et le `Dropdown` maison n'en fournissait pas
 * non plus. Le texte des notifications se superposait donc au tableau de bord, illisible.</p>
 *
 * <p>Le `Popover` v3 apporte la surface, l'elevation, le piege de focus et la fermeture
 * a l'echappement — tout ce que l'implementation maison laissait a la charge du contenu.</p>
 */
import { Popover } from '@heroui-v3/react';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useNotificationController } from './controller';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { DropdownMenuContent, DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Content = ({ className }: {
    isConnected?: boolean;
    className?: string
}) => {
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const ctrl = useNotificationController();
    return (
        <div className={`dropdown shrink-0 ${className}`}>
            <Popover>
                <Popover.Trigger
                    aria-label={`Notifications${ctrl.notificationNonLus.length ? ` — ${ctrl.notificationNonLus.length} non lues` : ''}`}
                    className="relative rounded-full p-2 hover:text-accent"
                >
                    <Bell aria-hidden="true" className="size-5" />
                    {ctrl.notificationNonLus.length > 0 && (
                        <span className="absolute -top-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface ltr:-right-1 rtl:-left-1">
                            {ctrl.notificationNonLus.length > 99 ? '99+' : ctrl.notificationNonLus.length}
                        </span>
                    )}
                </Popover.Trigger>

                <Popover.Content
                    className="w-[min(600px,calc(100vw-2rem))] p-0"
                    placement={isRtl ? 'bottom start' : 'bottom end'}
                >
                <ul className="divide-y divide-separator py-0! text-foreground">
                    <li onClick={(e) => e.stopPropagation()}>
                        <div className="flex-wrap lg:flex xl:flex items-center justify-between px-4 py-2 font-semibold">
                            <h4 className="text-lg text-red-500 font-bold">Notification</h4>
                            <span className='text-gray-500 cursor-pointer hover:text-gray-800' onClick={ctrl.toutMarqueCommeLus}>Tous marquer comme lus</span>
                        </div>
                    </li>
                    <li className='mt-5 border-none'> <span className='border-b-3 border-b-red-500 mb-5 font-bold pb-1 ml-5 '>Tous 1</span></li>
                    {ctrl.notificationNonLus.length > 0 ? (
                        <div className='max-h-[500px] overflow-auto'>
                            {ctrl.notificationNonLus.map((notification) => {
                                return (
                                    <div key={notification.id}>
                                        <li className="dark:text-white-light/90 p-2 w-full  hover:bg-primary/10 mt-5 " onClick={(e) => e.stopPropagation()}>
                                            <div className="group flex items-center px-4 py-2">
                                                <div className="grid place-content-center rounded">
                                                    <div className=" h-12 w-12 rounded-full flex items-center">
                                                        <span className={`absolute  block h-2 w-2 rounded-full ${ctrl.isConnected ? "bg-success" : " bg-red-500"}`}></span>
                                                        <Bell />
                                                    </div>
                                                </div>
                                                <div className="flex w-full  justify-between ltr:pl-3 rtl:pr-3 ml-2">
                                                    <div className="ltr:pr-3 rtl:pl-3">
                                                        <h6 className={`${"font-bold"}`}>{notification.titre}</h6>
                                                        {notification.message && <p className={`${!notification.lu && "font-semibold"}`}>{notification.message}</p>}
                                                        {
                                                            notification.lien &&
                                                            <div className='flex justify-between items-center'>
                                                                <Button className='h-8 mt-2 mb-2 py-2 rounded-full bg-linear-to-r from-red-600 to-red-500'>
                                                                    <Link href={notification.lien ? notification.lien : "#"}>
                                                                        {notification.type?.toString()
                                                                            .toLocaleLowerCase()
                                                                            .replace(/_/g, " ")
                                                                            .replace(/\b\w/g, char => char.toUpperCase())}</Link>
                                                                </Button>
                                                            </div>
                                                        }
                                                    </div>

                                                    <div className='flex-col gap-0 items-center'>
                                                        <span className="block text-xs font-normal dark:text-gray-500">{notification.tempsPasse}</span>
                                                        <DropdownMenu >
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" onPointerDown={(e) => e.stopPropagation()}>...</Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-16" onMouseDown={(e) => e.stopPropagation()}>
                                                                <DropdownMenuItem onMouseDown={(e) => e.stopPropagation()}>
                                                                    <Link href={"/notification/" + notification.id} >Detail</Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </div>
                                );
                            })}
                            <Link href={"/notification"}>
                                <div className="p-4 text-center">
                                    <span className=" font-bold text-md text-primary  w-full pl-2 pr-2 p-1 rounded-full cursor-pointer hover:bg-primary/30"
                                    >Voir tous</span>
                                </div></Link>

                        </div>
                    ) : (
                        <div className="text-center py-6 text-primary font-bold mt-10 text-xl">
                            <EmptyDataTable title='Aucun Resultat' />
                        </div>
                    )}
                </ul>
                </Popover.Content>
            </Popover>
        </div>
    );
};

export default Content;
