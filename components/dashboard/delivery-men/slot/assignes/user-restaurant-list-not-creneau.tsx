import { Restaurant } from "@/types/creneau-turbo";
import EmptyDataTable from "@/components/commons/EmptyDataTable";



export default function UserRestaurantListeNotCreneau({turboysCreneau} : {turboysCreneau:Restaurant[]}) {
    if(!turboysCreneau||turboysCreneau.length==0){
        return(  
            <div>
                <h2 className="text-lg font-semibold mb-2">Turboys n'ayant pas des créneaux</h2>
                <EmptyDataTable/>
            </div>
        )
    }

    return (
        <div className="relative mb-6 text-slate-500">
            <div className="relative mb-6">
                <h2 className="text-lg font-semibold mb-2">Turboys n'ayant pas des créneaux</h2>
                <div className="relative bg-white flex items-center flex-col gap-1 rounded-lg  overflow-auto">
                    { 
                        turboysCreneau.map((restaurant, index) => {
                            return (
                                <div key={index} className="w-full  flex gap-4  border-2 rounded-2xl">
                                    <div className="relative w-[230px]">
                                        <div className=" flex items-center px-2 py-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div> {restaurant.nomRestaurant}
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