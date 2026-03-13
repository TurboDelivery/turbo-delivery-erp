import { title } from '@/components/primitives';
import { Button, Card, CardBody, CardHeader, Divider, Link } from '@heroui/react';
import { ChevronRight } from 'lucide-react';

export default function DatabaseCards({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <h3 className={title({ size: 'h6', class: 'text-primary' })}>{item.label}</h3>
          </CardHeader>
          <CardBody>
            <div className="flex justify-between items-center">
              <p className={title({ size: 'h4' })}>{item.value}</p>
              {item.label === 'Turboys' && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <TurboysButton name={'Indépendants'} param={'INDEPENDANT'} />
                  <Divider />
                  <TurboysButton name={'Journaliers'} param={'JOURNALIER'} />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function TurboysButton({ name, param }: { name: string; param: string }) {
  return (
    <Button variant="light" as={Link} className="text-gray-500 px-2 py-1 rounded text-sm font-medium text-center" href={`/delivery-men/turboys?typeLivreur=${param}`}>
      {name}
      <ChevronRight className="inline-block ml-1" size={14} />
    </Button>
  );
}
