import { Card, CardBody, CardHeader } from "@heroui/react";

export default async function CongeStatistique() {
    return (
        <div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-600">Demandes en attente</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-bold text-yellow-600">0</div>
                        <p className="text-sm text-gray-500">En attente de validation</p>
                      </CardBody>
                    </Card>
            
                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-600">Demandes approuvées</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <p className="text-sm text-gray-500">Validées</p>
                      </CardBody>
                    </Card>
            
                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-600">Demandes rejetées</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-bold text-red-600">0</div>
                        <p className="text-sm text-gray-500">Refusées</p>
                      </CardBody>
                    </Card>
                  </div>
        </div>
    );
};