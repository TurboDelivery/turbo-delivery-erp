// "use client"
// import { CalendarInput } from "@/components/block/dateInput"
// import { Button } from "@/components/ui/button"
// import {
//     Dialog,
//     DialogClose,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Plus } from "lucide-react"
// import { useForm, Controller } from "react-hook-form" // Import Controller
// import { zodResolver } from "@hookform/resolvers/zod"

// import { useState } from "react"
// import { toast } from "sonner"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { RecouvrementCreateDTO, recouvrementFormSchema, RecouvrementUpdateDTO } from "@/feature/revenus/schemas/recouvrement/recouvrement.schema"
// import { useAjouterRecouvrementMutation } from "@/feature/revenus/queries/recouvrement/recouvrement.mutation"
// import { usePretListQuery } from "@/feature/revenus/queries/prets/pret-list.query"
// import { IFacture } from "@/feature/revenus/types/recouvrement/prets.types"

// export function ModifierRecouvrement() {
//     const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
//     const [open, setOpen] = useState(false)
//     const [selectedFile, setSelectedFile] = useState<File | null>(null)
//     const [selectedFacture, setSelectedFacture] = useState<IFacture | null>(null)

//     const { data: factures = [], isLoading: isLoadingFactures } = usePretListQuery({})

//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//         setValue,
//         reset,
//         control, // Ajout de control pour Controller
//         watch, // Pour surveiller les valeurs
//     } = useForm<RecouvrementUpdateDTO>({
//         resolver: zodResolver(recouvrementFormSchema),
//         defaultValues: {
//             montant: 0,
//             dateRecouvrement: '',
//             restaurantId: '',
//             preuve: undefined
//         },
//     });

//     const { mutateAsync: recouvrementCreateMutation, isPending: isLoading } = useAjouterRecouvrementMutation();

//     // Surveiller la valeur de restaurantId pour le débogage
//     const watchedRestaurantId = watch('restaurantId');

//     const onSubmitForm = async (data: RecouvrementUpdateDTO) => {
//         try {
//             console.log("Données du formulaire:", data);
//             console.log("restaurantId sélectionné:", data.restaurantId);

//             if (!selectedFile) {
//                 toast.error("Veuillez sélectionner un fichier de preuve");
//                 return;
//             }

//             if (!data.restaurantId || data.restaurantId === '') {
//                 toast.error("Veuillez sélectionner un restaurant");
//                 return;
//             }

//             const facture = factures.find(p => p.id === data.restaurantId);
//             if (!facture) {
//                 toast.error("Facture sélectionnée introuvable");
//                 return;
//             }

//             // Préparer les données avec la structure correcte
//             const submissionData = {
//                 ...data,
//                 preuve: selectedFile,
//                 factureDetails: facture
//             };
            
//             console.log("Données de soumission:", submissionData);

//             await recouvrementCreateMutation(submissionData);

//             reset();
//             setSelectedDate(undefined);
//             setSelectedFile(null);
//             setSelectedFacture(null);
//             setOpen(false);

//             toast.success("Recouvrement créé avec succès");
//         } catch (error) {
//             console.error("Erreur lors de la soumission:", error);
//             toast.error("Erreur lors de la création du recouvrement");
//         }
//     };

//     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (file) {
//             setSelectedFile(file);
//             setValue('preuve', file);
//         }
//     };

//     const handleDateChange = (date: Date | undefined) => {
//         setSelectedDate(date);
//         if (date) {
//             const formattedDate = date.toISOString().split('T')[0];
//             setValue('dateRecouvrement', formattedDate);
//         }
//     };


//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button
//                     className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 md:gap-2 px-3 py-2 h-9 md:h-10 text-sm md:text-base"
//                     size="sm"
//                 >
//                     <Plus className="w-4 h-4 md:w-5 md:h-5" />
//                     <span className="hidden md:inline">effectuer un recouvrement</span>
//                 </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full mx-2 sm:mx-auto my-2 sm:my-0 max-h-[90vh] overflow-y-auto">
//                 <DialogHeader className="px-1 sm:px-0">
//                     <DialogTitle className="text-lg sm:text-xl">Ajouter un recouvrement</DialogTitle>
//                     <DialogDescription className="text-sm sm:text-base">
//                         Ajoutez un nouveau recouvrement à votre liste
//                     </DialogDescription>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmitForm)} className="px-1 sm:px-0">
//                     <div className="grid gap-4 sm:gap-6">
//                         {/* Sélection du prêt avec Controller */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="restaurantId" className="text-sm text-gray-500">
//                                 Restaurant *
//                             </Label>
//                             <Controller
//                                 name="restaurantId"
//                                 control={control}
//                                 render={({ field }) => (
//                                     <Select
//                                     value={watchedRestaurantId}
//                                     onValueChange={(value) => {
//                                         setValue('restaurantId', value, { shouldValidate: true });
//                                         const facture = factures.find(p => p.id === value);
//                                         setSelectedFacture(facture || null);
//                                     }}
//                                 >
//                                         <SelectTrigger className="w-full">
//                                             <SelectValue placeholder="Sélectionnez un prêt" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {isLoadingFactures ? (
//                                                 <SelectItem value="" disabled>Chargement...</SelectItem>
//                                             ) : factures.length === 0 ? (
//                                                 <SelectItem value="" disabled>Aucun prêt disponible</SelectItem>
//                                             ) : (
//                                                 factures.map((facture: IFacture) => (
//                                                     <SelectItem key={facture.id} value={facture.id}>
//                                                         {facture.nomRestaurant} - {facture.totalFraisLivraisons + facture.totalCommission} FCFA
//                                                     </SelectItem>
//                                                 ))
//                                             )}
//                                         </SelectContent>
//                                     </Select>
//                                 )}
//                             />
//                             {errors.restaurantId && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.restaurantId.message}</p>
//                             )}
//                             {/* Debug */}
//                             <p className="text-xs text-gray-400">Valeur actuelle: {watchedRestaurantId || 'Aucune'}</p>
//                         </div>

//                         {/* Montant */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="montant" className="text-sm text-gray-500">
//                                 Montant *
//                             </Label>
//                             <Input
//                                 id="montant"
//                                 {...register('montant', { valueAsNumber: true })}
//                                 placeholder="Montant du recouvrement"
//                                 type="number"
//                                 step="0.01"
//                                 min="0"
//                                 className="w-full"
//                             />
//                             {errors.montant && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.montant.message}</p>
//                             )}
//                         </div>

//                         {/* Date du recouvrement */}
//                         <div className="flex flex-col gap-1 sm:gap-2">
//                             <Label htmlFor="dateRecouvrement" className="text-sm text-gray-500">
//                                 Date du recouvrement *
//                             </Label>
//                             <CalendarInput
//                                 value={selectedDate}
//                                 onChange={handleDateChange}
//                                 placeholder="Sélectionnez une date"
//                             />
//                             {errors.dateRecouvrement && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.dateRecouvrement.message}</p>
//                             )}
//                         </div>

//                         {/* Preuve (fichier) */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="preuve" className="text-sm text-gray-500">
//                                 Preuve de paiement *
//                             </Label>
//                             <Input
//                                 id="preuve"
//                                 type="file"
//                                 accept="image/*,.pdf"
//                                 onChange={handleFileChange}
//                                 className="w-full"
//                                 required
//                             />
//                             {selectedFile && (
//                                 <p className="text-sm text-gray-600">Fichier sélectionné: {selectedFile.name}</p>
//                             )}
//                             {errors.preuve && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.preuve.message}</p>
//                             )}
//                         </div>
//                     </div>

//                     <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
//                         <DialogClose asChild>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 className="rounded-full w-full sm:w-auto cursor-pointer order-2 sm:order-1"
//                                 size="sm"
//                                 onClick={() => {
//                                     reset();
//                                     setSelectedDate(undefined);
//                                     setSelectedFile(null);
//                                     setSelectedFacture(null);
//                                 }}
//                             >
//                                 Annuler
//                             </Button>
//                         </DialogClose>
//                         <Button
//                             type="submit"
//                             className="cursor-pointer bg-amber-500 hover:bg-amber-600 w-full sm:w-auto order-1 sm:order-2"
//                             disabled={isLoading}
//                             size="sm"
//                         >
//                             {isLoading ? 'Création...' : 'Ajouter'}
//                         </Button>
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     )
// }