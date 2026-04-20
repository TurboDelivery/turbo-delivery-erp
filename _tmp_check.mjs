
const newContent = `'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@heroic/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import {
  updateRestaurantSchema,
  type UpdateRestaurantDTO,
} from '@/features/restaurants/schemas/update-restaurant.schema';
import { updateRestaurant } from '@/features/restaurants/actions/update-restaurant.action';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { createUrlFile } from '@/utils/createUrlFile';
import { CoverBanner } from './_sections/CoverBanner';
import { InfoGenerales } from './_sections/InfoGenerales';
import { CommissionSection } from './_sections/CommissionSection';
import { PhotosSection } from './_sections/PhotosSection';
import { HorairesSection } from './_sections/HorairesSection';
import { AutresDocumentsSection } from './_sections/AutresDocumentsSection';
`;
