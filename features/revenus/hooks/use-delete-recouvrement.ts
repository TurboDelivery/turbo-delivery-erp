import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supprimerRecouvrementAction } from "@/features/revenus/actions/recouvrement/recouvrement.action"
import { toast } from "sonner"

export function useDeleteRecouvrement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supprimerRecouvrementAction(id)
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression du recouvrement')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recouvrement'] })
      queryClient.invalidateQueries({ queryKey: ['recouvrement-list'] })
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || "Erreur lors de la suppression")
    }
  })
}
