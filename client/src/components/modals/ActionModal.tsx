import { useState } from "react";
import { X, Coffee, RefreshCw, LogOut, Clipboard } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeStatus } from "@shared/schema";

export const ActionModal = () => {
  const { toast } = useToast();
  const { 
    showActionModal, 
    setShowActionModal, 
    selectedEvent,
    selectedEmployee,
    setSelectedEmployee
  } = useEmployeeContext();
  
  const [notes, setNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!selectedEmployee) return null;
  
  const handleClose = () => {
    setShowActionModal(false);
    setSelectedAction(null);
    setNotes("");
  };
  
  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.WORKING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="h-2 w-2 bg-blue-500 rounded-full mr-1"></span> Trabalhando
          </span>
        );
      case EmployeeStatus.ON_BREAK:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="h-2 w-2 bg-yellow-500 rounded-full mr-1"></span> Em pausa
          </span>
        );
      case EmployeeStatus.CHECKED_OUT:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="h-2 w-2 bg-gray-500 rounded-full mr-1"></span> Finalizado
          </span>
        );
      case EmployeeStatus.ABSENT:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span> Ausente
          </span>
        );
      default:
        return null;
    }
  };
  
  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
  };
  
  const handleSubmit = async () => {
    if (!selectedAction || !selectedEmployee || !selectedEvent) {
      toast({
        title: "Erro",
        description: "Selecione uma ação e confira se o funcionário e evento estão selecionados",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call API to record the action
      const response = await apiRequest("POST", "/api/time-records", {
        employeeId: selectedEmployee.id,
        eventId: selectedEvent.id,
        recordType: selectedAction,
        notes: notes || null,
        timestamp: new Date()
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Ação registrada",
        description: `${selectedAction === "check_in" ? "Entrada" : 
                       selectedAction === "check_out" ? "Saída" : 
                       selectedAction === "break_start" ? "Início de pausa" : 
                       "Retorno de pausa"} registrada com sucesso`,
        variant: "success"
      });
      
      // Close the modal
      handleClose();
      
    } catch (error) {
      console.error("Error recording action:", error);
      toast({
        title: "Erro",
        description: "Falha ao registrar a ação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine which actions should be enabled based on current status
  const getEnabledActions = () => {
    const status = selectedEmployee.status;
    
    switch (status) {
      case EmployeeStatus.ABSENT:
        // If absent, only check-in is available
        return {
          checkIn: true,
          breakStart: false,
          breakEnd: false,
          checkOut: false
        };
      case EmployeeStatus.WORKING:
        // If working, can start break or check out
        return {
          checkIn: false,
          breakStart: true,
          breakEnd: false,
          checkOut: true
        };
      case EmployeeStatus.ON_BREAK:
        // If on break, can only end break
        return {
          checkIn: false,
          breakStart: false,
          breakEnd: true,
          checkOut: false
        };
      case EmployeeStatus.CHECKED_OUT:
        // If checked out, can only check in again
        return {
          checkIn: true,
          breakStart: false,
          breakEnd: false,
          checkOut: false
        };
      default:
        return {
          checkIn: true,
          breakStart: false,
          breakEnd: false,
          checkOut: false
        };
    }
  };
  
  const enabledActions = getEnabledActions();

  return (
    <Dialog open={showActionModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Atividade</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center mb-6">
          <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center text-primary font-semibold text-xl">
            {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-800">{selectedEmployee.name}</h4>
            <p className="text-gray-600">EMP{String(selectedEmployee.id).padStart(4, '0')} • {selectedEmployee.role}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Status Atual:</span>
            {getStatusBadge(selectedEmployee.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Entrada:</span>
            <span className="text-sm text-gray-600">
              {selectedEmployee.checkInTime ? `Hoje, ${selectedEmployee.checkInTime}` : 'Não registrada'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Selecionar Ação:</h5>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className={`flex flex-col items-center ${enabledActions.breakStart ? 'bg-yellow-50 hover:bg-yellow-100 text-warning border-yellow-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} p-3 rounded-lg h-auto`}
              onClick={() => enabledActions.breakStart && handleActionSelect("break_start")}
              disabled={!enabledActions.breakStart}
              data-selected={selectedAction === "break_start"}
              data-state={selectedAction === "break_start" ? "selected" : ""}
            >
              <Coffee className="text-xl mb-1 h-5 w-5" />
              <span className="text-sm font-medium">Pausa</span>
            </Button>
            
            <Button 
              variant="outline"
              className={`flex flex-col items-center ${enabledActions.breakEnd ? 'bg-blue-50 hover:bg-blue-100 text-primary border-blue-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} p-3 rounded-lg h-auto`}
              onClick={() => enabledActions.breakEnd && handleActionSelect("break_end")}
              disabled={!enabledActions.breakEnd}
              data-selected={selectedAction === "break_end"}
              data-state={selectedAction === "break_end" ? "selected" : ""}
            >
              <RefreshCw className="text-xl mb-1 h-5 w-5" />
              <span className="text-sm font-medium">Retorno</span>
            </Button>
            
            <Button 
              variant="outline"
              className={`flex flex-col items-center ${enabledActions.checkOut ? 'bg-red-50 hover:bg-red-100 text-danger border-red-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} p-3 rounded-lg h-auto`}
              onClick={() => enabledActions.checkOut && handleActionSelect("check_out")}
              disabled={!enabledActions.checkOut}
              data-selected={selectedAction === "check_out"}
              data-state={selectedAction === "check_out" ? "selected" : ""}
            >
              <LogOut className="text-xl mb-1 h-5 w-5" />
              <span className="text-sm font-medium">Saída</span>
            </Button>
            
            <Button 
              variant="outline"
              className={`flex flex-col items-center ${enabledActions.checkIn ? 'bg-green-50 hover:bg-green-100 text-success border-green-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} p-3 rounded-lg h-auto`}
              onClick={() => enabledActions.checkIn && handleActionSelect("check_in")}
              disabled={!enabledActions.checkIn}
              data-selected={selectedAction === "check_in"}
              data-state={selectedAction === "check_in" ? "selected" : ""}
            >
              <Clipboard className="text-xl mb-1 h-5 w-5" />
              <span className="text-sm font-medium">Entrada</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional):</label>
          <Textarea 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
            rows={2} 
            placeholder="Adicionar observações..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter className="flex space-x-3">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAction || isSubmitting}
            className="bg-primary hover:bg-blue-600 text-white flex-grow"
          >
            {isSubmitting ? "Processando..." : "Confirmar"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
