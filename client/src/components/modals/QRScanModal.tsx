import { useState, useEffect } from "react";
import { X, QrCode, Camera } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQRReader } from "@/hooks/useQRReader";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const QRScanModal = () => {
  const { toast } = useToast();
  const { 
    showQRScanModal, 
    setShowQRScanModal, 
    selectedEvent,
    selectedEmployee,
    setSelectedEmployee
  } = useEmployeeContext();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanAction, setScanAction] = useState<"check_in" | "check_out" | "break_start" | "break_end" | null>(null);
  
  const { 
    videoRef, 
    canvasRef, 
    startScanning, 
    stopScanning, 
    lastResult 
  } = useQRReader();

  useEffect(() => {
    if (showQRScanModal && isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [showQRScanModal, isScanning, startScanning, stopScanning]);

  useEffect(() => {
    if (lastResult && isScanning) {
      handleQRCodeScanned(lastResult);
    }
  }, [lastResult, isScanning]);

  const handleStartScanning = () => {
    if (!selectedEvent) {
      toast({
        title: "Nenhum evento selecionado",
        description: "Por favor, selecione um evento antes de escanear.",
        variant: "destructive"
      });
      return;
    }
    
    setIsScanning(true);
  };

  const handleQRCodeScanned = async (result: string) => {
    try {
      // Stop scanning as soon as we detect a result
      setIsScanning(false);
      
      // Parse the QR code data
      const scannedData = JSON.parse(result);
      
      if (!scannedData.employeeId || !selectedEvent) {
        throw new Error("Código QR inválido ou evento não selecionado");
      }
      
      // Determine action if not already specified
      const actionToUse = scanAction || "check_in";
      
      // Call API to process the scan
      const response = await apiRequest("POST", "/api/scan", {
        employeeId: scannedData.employeeId,
        eventId: selectedEvent.id,
        recordType: actionToUse,
        notes: "Escaneado via QR code"
      });
      
      const data = await response.json();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Registro bem-sucedido",
        description: `${actionToUse === "check_in" ? "Entrada" : 
                       actionToUse === "check_out" ? "Saída" : 
                       actionToUse === "break_start" ? "Início de pausa" : 
                       "Retorno de pausa"} registrado para ${data.employee.name}`,
        variant: "success"
      });
      
      // Close the modal
      setShowQRScanModal(false);
      
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast({
        title: "Erro no escaneamento",
        description: error instanceof Error ? error.message : "Falha ao processar o código QR",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    setIsScanning(false);
    setShowQRScanModal(false);
    setScanAction(null);
  };
  
  const handleScanForType = (type: "check_in" | "check_out" | "break_start" | "break_end") => {
    setScanAction(type);
    handleStartScanning();
  };
  
  const renderScanOptions = () => {
    if (selectedEmployee) {
      return (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button 
            onClick={() => handleScanForType("check_in")}
            className="flex flex-col items-center bg-green-50 hover:bg-green-100 text-success p-3 rounded-lg border border-green-200 h-auto"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Entrada</span>
          </Button>
          
          <Button 
            onClick={() => handleScanForType("break_start")}
            className="flex flex-col items-center bg-yellow-50 hover:bg-yellow-100 text-warning p-3 rounded-lg border border-yellow-200 h-auto"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Pausa</span>
          </Button>
          
          <Button 
            onClick={() => handleScanForType("break_end")}
            className="flex flex-col items-center bg-blue-50 hover:bg-blue-100 text-primary p-3 rounded-lg border border-blue-200 h-auto"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Retorno</span>
          </Button>
          
          <Button 
            onClick={() => handleScanForType("check_out")}
            className="flex flex-col items-center bg-red-50 hover:bg-red-100 text-danger p-3 rounded-lg border border-red-200 h-auto"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Saída</span>
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={showQRScanModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código</DialogTitle>
          <DialogDescription>
            Posicione o código QR ou código de barras do funcionário na área de escaneamento
          </DialogDescription>
        </DialogHeader>
        
        {selectedEmployee && (
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-primary font-semibold text-xl">
              {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-800">{selectedEmployee.name}</h4>
              <p className="text-gray-600">EMP{String(selectedEmployee.id).padStart(4, '0')} • {selectedEmployee.role}</p>
            </div>
          </div>
        )}
        
        {renderScanOptions()}
        
        <div className="relative">
          <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center text-gray-600 text-sm">
            {isScanning ? "Escaneando... Aponte a câmera para o código QR" : "Clique em iniciar escaneamento para ativar a câmera"}
          </div>
          
          <div className="aspect-square max-w-full mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-6 overflow-hidden">
            {isScanning ? (
              <video 
                ref={videoRef} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Câmera de escaneamento</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleStartScanning}
            type="submit"
            disabled={isScanning}
            className="bg-primary hover:bg-blue-600 text-white"
          >
            <QrCode className="h-4 w-4 mr-2" /> 
            {isScanning ? "Escaneando..." : "Iniciar Escaneamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
