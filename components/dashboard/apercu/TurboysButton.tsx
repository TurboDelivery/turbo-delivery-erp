import { Button, Link } from '@heroui/react';
import { ChevronRight } from 'lucide-react';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { TurboyType } from '@/features/turboys/types/turboys.types';

export function TurboysButton({ name, param }: { name: string; param: TurboyType }) {
  const { data: turboysData } = useTurboysByTypeQuery({ typeLivreur: param, page: 0, limit: 1 });
  return (
    <Button variant="light" as={Link} className="text-muted-foreground text-xs font-medium" href={`/delivery-men/turboys?typeLivreur=${param}`}>
      {name} ({turboysData?.totalElements ?? 0})
      <ChevronRight className="inline-block ml-1" size={14} />
    </Button>
  );
}
