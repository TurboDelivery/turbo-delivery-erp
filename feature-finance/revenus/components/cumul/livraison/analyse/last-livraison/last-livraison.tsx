import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"
import { useMemo } from "react"
import { format, formatDate, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface LastLivraisonProps {
    lastlivraisons?: ILivraison[];
}

export default function LastLivraison({ lastlivraisons }: LastLivraisonProps) {
    
    // Filtrer les investissements du mois courant
    const livraisonsMoisCourant = useMemo(() => {
        if (!lastlivraisons) return [];
        
        const maintenant = new Date();
        const moisCourant = maintenant.getMonth();
        const anneeCourante = maintenant.getFullYear();
        
        return lastlivraisons.filter(livraison => {
            const dateLivraison = new Date(livraison.createdAt);
            return dateLivraison.getMonth() === moisCourant && 
                   dateLivraison.getFullYear() === anneeCourante;
        });
    }, [lastlivraisons]);
 
      const formatDate = (dateString: string) => {
            if (!dateString) return "";
    
            try {
                const date = parseISO(dateString);
                return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
            } catch (error) {
                console.warn("Erreur de formatage de date:", error);
                return dateString;
            }
        };

    return (
        <div className="p-4">
            <Card className="max-w-6xl mx-auto shadow-lg rounded-xl overflow-hidden border-0">
                <CardHeader className="py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-xl font-bold flex items-center text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Investissements du mois courant
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-5">
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            plugins={[
                                Autoplay({
                                    delay: 1000,
                                    stopOnInteraction: false,
                                    stopOnMouseEnter: true,
                                })
                            ]}
                            orientation="vertical"
                            className="w-full max-w-md mx-auto"
                        >
                            <CarouselContent className="h-[400px]">
                                {livraisonsMoisCourant?.map((livraison, index) => (
                                    <CarouselItem key={index} className="pt-4 basis-1/2">
                                        <div className="p-2">
                                            <Card className="rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                                                <div className="p-4">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <span className="text-xs text-gray-500 font-medium">Livreur</span>
                                                                <h3 className="font-semibold text-sm text-blue-600">{livraison.nomLivreur}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs text-gray-500 block">Cout</span>
                                                                <span className="text-sm font-bold text-green-600">{livraison.totalAmount.toLocaleString()} FCFA</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <span className="text-xs text-gray-500 font-medium">restaurant</span>
                                                                <h3 className="font-semibold text-sm text-blue-600">{livraison.nomRestaurant}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs text-gray-500 block">commission</span>
                                                                <span className="text-sm font-bold text-green-600">{livraison.fraisLivraison.toLocaleString()} FCFA</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-gray-500">Date</span>
                                                                <span className="text-xs font-medium">{formatDate(livraison.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <div className="flex justify-center gap-2 mt-4">
                                <CarouselPrevious className="relative static mt-0 transform-none" />
                                <CarouselNext className="relative static mt-0 transform-none" />
                            </div>
                        </Carousel>
                    </div>

                    {/* Pied de carte avec statistiques */}
                    <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Total ce mois: {livraisonsMoisCourant?.length} investissement(s)
                            </div>
                            <div className="text-sm font-semibold text-blue-600">
                                Montant total: {livraisonsMoisCourant?.reduce((sum, invest) => sum + invest.commission, 0).toLocaleString()} FCFA
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}