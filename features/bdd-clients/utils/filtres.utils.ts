import type { IFiltresClients } from '../types/bdd-clients.types';

/**
 * Y a-t-il un critère posé, ou regarde-t-on la base entière ?
 *
 * <h3>Pourquoi cette question mérite une fonction</h3>
 * <p>Une liste vide a deux causes qui ne se ressemblent pas, et l'écran doit les
 * distinguer. « Aucun client ne correspond à ces filtres » devant une base VIDE et sans
 * filtre envoie chercher une erreur de filtre là où il n'y a rien à trouver : l'opérateur
 * décoche, recharge, doute de l'écran. La vraie phrase, à ce moment-là, est qu'il n'y a
 * encore rien et par où commencer.</p>
 *
 * <p>⚠ La PAGE ne compte pas comme un critère. Elle change ce qu'on regarde, pas la
 * population ; la compter poserait un filtre permanent et ferait mentir le message dès
 * la deuxième page.</p>
 *
 * <p>⚠ `logique` non plus : elle dit comment croiser les partenaires choisis, et vaut
 * « AU_MOINS_UN » même quand aucun ne l'est. Elle ne restreint rien toute seule.</p>
 */
export function aUnFiltrePose(filtres: IFiltresClients): boolean {
  return (
    filtres.recherche.trim() !== '' ||
    filtres.partenaires.length > 0 ||
    filtres.zones.length > 0 ||
    filtres.debut !== '' ||
    filtres.fin !== '' ||
    filtres.statut !== '' ||
    filtres.segment !== '' ||
    filtres.consentement !== '' ||
    filtres.capturesMin !== null ||
    filtres.capturesMax !== null ||
    filtres.partenairesMin !== null
  );
}
