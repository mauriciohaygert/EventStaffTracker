import { 
  QrCode, 
  UserPlus, 
  Clock, 
  Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useEmployeeContext } from "@/context/EmployeeContext";

const QuickActions = () => {
  const { 
    setShowQRScanModal, 
    setShowEmployeeModal 
  } = useEmployeeContext();

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <CardTitle className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowQRScanModal(true)}
            variant="outline"
            className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-primary p-4 rounded-lg transition h-auto"
          >
            <QrCode className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Escanear Código</span>
          </Button>
          
          <Button
            onClick={() => setShowEmployeeModal(true)}
            variant="outline"
            className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-success p-4 rounded-lg transition h-auto"
          >
            <UserPlus className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Novo Funcionário</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 p-4 rounded-lg transition h-auto"
          >
            <Clock className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Gerenciar Turnos</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 p-4 rounded-lg transition h-auto"
          >
            <Download className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Exportar Relatório</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
