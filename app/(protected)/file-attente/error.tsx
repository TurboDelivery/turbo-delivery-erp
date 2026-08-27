'use client';

import ErreurSegment from '@/components/commons/ErreurSegment';

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
    return <ErreurSegment section="La file d’attente" {...props} />;
}
