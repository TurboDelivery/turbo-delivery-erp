import { Button, Link } from '@heroui/react';
import { ChevronRight } from 'lucide-react';
import { TurboyType } from '@/features/turboys/types/turboys.types';

export function TurboysButton({ name, param, value=0 }: { name: string; param: TurboyType; value?: number }) {
  return (
    <Button variant="light" as={Link} className="text-muted-foreground text-xs font-medium" href={`/delivery-men/turboys?typeLivreur=${param}`}>
      {name} ({value})
      <ChevronRight className="inline-block ml-1" size={14} />
    </Button>
  );
}
