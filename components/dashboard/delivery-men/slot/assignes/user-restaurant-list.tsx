import { Restaurant } from "@/types/creneau-turbo";
import progresseBare from "../../progression/progression-barre";
import { IconPointFilled } from "@tabler/icons-react";
import DropDownAction from "../dropDownAction";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { Avatar } from "@heroui/react";
import { createUrlFile } from "@/utils/createUrlFile";
import { formatDateFr as formatDate } from "@/lib/date-utils";


export default function UserRestaurantListe({ turboysCreneau }: { turboysCreneau: Restaurant[] }) {
    if (!turboysCreneau || turboysCreneau.length == 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold mb-2">Restaurant ayant des créneaux</h2>
                <EmptyDataTable />
            </div>
        )
    }

    return (
        <div className="relative mb-6 text-slate-500">
            <div className="relative mb-6">
                <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">RESTAURANT(S) AYANT DES TURBOYS AVEC CRENEAU HORAIRE</h2>
                <div className="relative flex items-center flex-col gap-1 rounded-md overflow-auto">
                    {
                        turboysCreneau.map((restaurant, index) => {
                            return (
                                <div key={index} className="w-full bg-white shadow flex gap-4 border-2 rounded-md">
                                    <div className="relative w-[180px] flex flex-col items-center text-center space-y-2 p-3">
                                        {/* Logo */}
                                        <Avatar
                                            isBordered
                                            radius="full"
                                            size="lg"
                                            src={restaurant?.logo ? createUrlFile(restaurant?.logo ?? '', "restaurant") : 'assets/images/avatar.png'}
                                        />

                                        {/* Nom restaurant */}
                                        <p className="text-md font-semibold">{restaurant.nomRestaurant}</p>

                                        {/* Nombre livreurs */}
                                        <p className="text-lg font-semibold">{restaurant.nombreLivreur}</p>
                                    </div>

                                    <div className="flex-grow border-l-2 ">
                                        <div className="flex flex-col py-2">
                                            {restaurant.livreurs.map((child) => {
                                                return (
                                                    <div key={child.id} className="font-semibold flex items-center px-2 py-2">
                                                        <div className="w-8">
                                                            <Avatar isBordered radius="full" size="sm" src={createUrlFile(child?.avatar ?? '', "backend")} />
                                                        </div>
                                                        <p className="w-2/6 text-md px-2">{child.nomComplet}</p>
                                                        <p className="w-1/5 px-2">
                                                            <span className="pr-1">Inscrit le :</span> <span className="text-gray-600">{formatDate(child.dateInscrit, 'dd/MM/yyyy')}</span>
                                                        </p>
                                                        <p className="w-1/5 px-2">
                                                            <span className="pr-1">Defini le: </span> <span className="text-gray-600">{child.dateDefiniEmploiTemps != null ? formatDate(child.dateDefiniEmploiTemps, 'dd/MM/yyyy') : '-' }</span>
                                                        </p>
                                                        <div className="relative w-2/5 px-2 flex items-center justify-between">
                                                            {progresseBare(child)}
                                                            <span className="flex items-end mt-6">
                                                                {child.disponibilite
                                                                    ? <IconPointFilled color="#16B84E" size={30} />
                                                                    : <IconPointFilled color="#FF0000" size={30} />
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="px-2">
                                                            <DropDownAction id={child.id} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    )
}