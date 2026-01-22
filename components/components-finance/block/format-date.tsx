import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseISO } from "date-fns";

export function formatDate(dateString: string) {
    if (!dateString) return "";

    try {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
        console.warn("Erreur de formatage de date:", error);
        return dateString;
    }
};