import React from 'react';
import Content from './content';
import { getUsers } from '@/src/actions/users.actions';
import { getTypePlats } from '@/src/actions/type-plats.actions';
import { getDeliveryMen } from '@/src/actions/delivery-men.actions';
import { ChiffreAffaireRestaurant } from '@/types/statistiques.model';
import { getRestaurants } from '@/src/restaurants/restaurants.actions';
import { getAllChiffreAffaire, getAllRestaurantChiffreAffaire } from '@/src/actions/statistiques.action';

export default async function Page() {
    const users = await getUsers();
    const deliveryMen = await getDeliveryMen();
    const restaurants = await getRestaurants(0);
    const typePlats = await getTypePlats();
    const chiffreAffaire = await getAllChiffreAffaire({ dates: { start: null, end: null } });
    const chiffresAffairesRestaurants: ChiffreAffaireRestaurant[] = await getAllRestaurantChiffreAffaire({ dates: { start: null, end: null } });
    const initialItems = { deliveryMen, restaurants, typePlats, users, chiffreAffaire, chiffresAffairesRestaurants };

    return <Content initialItems={initialItems} />;
}
