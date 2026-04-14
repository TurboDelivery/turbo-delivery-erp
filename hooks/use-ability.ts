'use client';

import { useContext } from 'react';
import { AbilityContext } from '@/lib/casl/ability-context';

export const useAbility = () => useContext(AbilityContext);
