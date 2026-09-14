import Content from "./content"
import { Metadata } from "next";
import { getAllPerformanceBird } from "@/src/performance/performance.action";
import { TAILLE_LISTE_PERFORMANCE } from "@/src/performance/performance.constants";
import { SelecteurSemaine } from "@/features/performance/components/selecteur-semaine";
import { semaineIsoDepuisLundi } from "@/features/performance/utils/semaine-iso.utils";

export const metadata: Metadata = {
    title: "PERFORMANCES BIRDS",
    description: "LISTE DES PERFORMANCES BIRDS",
};

/**
 * La semaine lue vient de l'URL, pas d'un etat local : elle survit au rechargement et se
 * partage par copier-coller. Absente, le serveur rend la semaine en cours.
 */
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ semaine?: string }>;
}) {
    const { semaine: lundi } = await searchParams;
    const iso = lundi ? semaineIsoDepuisLundi(lundi) : undefined;

    const response = await getAllPerformanceBird(0, TAILLE_LISTE_PERFORMANCE, iso?.annee, iso?.semaine);

    return (
        <>
            <SelecteurSemaine semaine={lundi} />
            <Content initialData={response} />
        </>
    );
}