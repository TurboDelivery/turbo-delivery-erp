'use client';

import { createContextualCan } from '@casl/react';
import { AbilityContext } from '@/lib/casl/ability-context';

export const Can = createContextualCan(AbilityContext.Consumer);
