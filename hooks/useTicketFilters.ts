"use client";

import { useQueryStates } from "nuqs";
import { ticketFiltersSchema } from "@/lib/ticket-filters.schema";
import { filter } from "lodash";

export function useTicketFilters() {
  const [filters, setFilters] = useQueryStates(ticketFiltersSchema);

  const setFilter = <K extends keyof typeof ticketFiltersSchema>(
    key: K,
    value: string
  ) => {
    setFilters({ [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      livreur: "",
      restaurant: "",
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
      tab: "tous",
    });
  };

  return { filters, setFilter, resetFilters };
}
