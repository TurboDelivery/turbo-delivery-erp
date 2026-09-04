import { Restaurant } from "@/types/creneau-turbo";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { Avatar } from "@/components/heroui";
import { createUrlFile } from "@/utils/createUrlFile";



export default function UserRestaurantListeNotCreneau({turboysCreneau} : {turboysCreneau:Restaurant[]}) {
    if(!turboysCreneau||turboysCreneau.length==0){
        return(  
            <div>
                <h2 className="text-lg font-semibold mb-2">Restaurant n'ayant pas des créneaux</h2>
                <EmptyDataTable title="Aucun restaurant" />
            </div>
        )
    }

    return (
        <div className="relative mb-6 text-slate-500">
            <div className="relative mb-6">
                <h2 className="text-lg font-semibold bg-surface text-center w-full rounded-md shadow-sm py-2 mb-2">RESTAURANT(S) N'AYANT PAS DE TURBOYS AVEC CRENEAU HORAIRE</h2>
                <div className="relative flex items-center flex-col gap-1 rounded-lg overflow-auto">
                    { 
                        turboysCreneau.map((restaurant, index) => {
                            return (
                                <div key={index} className="w-full bg-surface flex gap-4 border-2 rounded-md">
                                    <div className="relative w-[230px]">
                                        <div className="flex items-center px-2 py-3">
                                            <Avatar
                                                isBordered
                                                radius="full"
                                                className="w-10 h-10 mr-3"
                                                size="md"
                                                src={restaurant?.logo ? createUrlFile(restaurant?.logo ?? '', "restaurant") : 'assets/images/logo.png'}
                                            />
                                            {restaurant.nomRestaurant}
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