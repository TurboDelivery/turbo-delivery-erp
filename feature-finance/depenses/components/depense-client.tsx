"use client";

import Statistics from "@/feature-finance/depenses/components/statistiques/statistics";
import RepartitionDepense from "@/feature-finance/depenses/components/repartition/index";
import DepenseTabs from "@/feature-finance/depenses/components/depense-list/depense-tabs";
import { LastDepense } from "@/feature-finance/depenses/components/depense-list/last-depense";

import { useDepensesListQuery } from "@/feature-finance/depenses/queries/depense-list.query";
import { useCategorieDepensesListQuery } from "../queries/category/categorie-depense.query";
import DepenseHeader from "@/components/components-finance/depenses/header";

export default function DepenseClient() {
    const { data: depensesData, isLoading, error } = useDepensesListQuery({ page: 1, limit: 50 });
    const { data: categorie_depensesData } = useCategorieDepensesListQuery({ params: { page: 1, limit: 50 } });

    const depenses = depensesData || [];
    const categorie_depenses = categorie_depensesData || [];

    return (
        <div>
            <DepenseHeader/>
            <Statistics categorie_depenses={categorie_depenses} depenses={depenses} />  
            <RepartitionDepense depenses={depenses} />
            <DepenseTabs depenses={depenses} categorie_depenses={categorie_depenses} />
            <LastDepense depenses={depenses}/>
        </div>
    )
}
