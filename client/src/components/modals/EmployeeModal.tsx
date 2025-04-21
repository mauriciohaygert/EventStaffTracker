import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { insertEmployeeSchema } from "@shared/schema";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { InfoIcon, Upload, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { generateQRCode } from "@/lib/qrUtils";

// Extend the schema for additional validation
const formSchema = insertEmployeeSchema.extend({
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  document: z.string().min(11, "CPF deve ter 11 dígitos"),
  email: z.string().email("Email inválido"),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  role: z.string().min(1, "Selecione uma função"),
  eventId: z.number().min(1, "Selecione um evento")
});

export const EmployeeModal = () => {
  const { toast } = useToast();
  const { 
    showEmployeeModal, 
    setShowEmployeeModal, 
    selectedEvent,
    selectedEmployee,
    setSelectedEmployee
  } = useEmployeeContext();
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Initialize form with default values or selected employee data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      role: "",
      eventId: selectedEvent?.id || 0,
      defaultStartTime: "",
      defaultEndTime: "",
      photoUrl: ""
    }
  });
  
  // Update form values when selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee) {
      // Reset the form with employee data
      form.reset({
        name: selectedEmployee.name,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        document: selectedEmployee.document,
        role: selectedEmployee.role,
        eventId: selectedEmployee.eventId,
        defaultStartTime: selectedEmployee.defaultStartTime || "",
        defaultEndTime: selectedEmployee.defaultEndTime || "",
        photoUrl: selectedEmployee.photoUrl || ""
      });
      
      // Generate QR code for existing employee
      const qrData = JSON.stringify({ employeeId: selectedEmployee.id });
      generateQRCode(qrData).then(url => {
        setQrCodeUrl(url);
      });
    } else {
      // Reset form for new employee
      form.reset({
        name: "",
        email: "",
        phone: "",
        document: "",
        role: "",
        eventId: selectedEvent?.id || 0,
        defaultStartTime: "",
        defaultEndTime: "",
        photoUrl: ""
      });
      setQrCodeUrl(null);
    }
  }, [selectedEmployee, selectedEvent, form]);
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (selectedEmployee) {
        // Update existing employee
        const response = await apiRequest("PATCH", `/api/employees/${selectedEmployee.id}`, data);
        const updatedEmployee = await response.json();
        
        toast({
          title: "Funcionário atualizado",
          description: `${updatedEmployee.name} foi atualizado com sucesso.`,
          variant: "success"
        });
        
      } else {
        // Create new employee
        const response = await apiRequest("POST", "/api/employees", data);
        const newEmployee = await response.json();
        
        // Generate QR code for new employee
        const qrData = JSON.stringify({ employeeId: newEmployee.id });
        const qrUrl = await generateQRCode(qrData);
        setQrCodeUrl(qrUrl);
        setShowQRCode(true);
        
        toast({
          title: "Funcionário cadastrado",
          description: `${newEmployee.name} foi cadastrado com sucesso.`,
          variant: "success"
        });
      }
      
      // Invalidate employees query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      
      // Don't close the modal if we're showing the QR code
      if (!showQRCode) {
        handleClose();
      }
      
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar o funcionário. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleClose = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
    setShowQRCode(false);
    form.reset();
  };
  
  const handleDoneWithQRCode = () => {
    handleClose();
  };

  return (
    <Dialog open={showEmployeeModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedEmployee ? "Editar Funcionário" : "Adicionar Novo Funcionário"}
          </DialogTitle>
        </DialogHeader>
        
        {!showQRCode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Documento (CPF) *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Segurança">Segurança</SelectItem>
                            <SelectItem value="Recepção">Recepção</SelectItem>
                            <SelectItem value="Técnico">Técnico</SelectItem>
                            <SelectItem value="Atendimento">Atendimento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Evento *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o evento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events?.map((event: any) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <FormLabel>Horário Padrão</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="defaultStartTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">Entrada</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="defaultEndTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">Saída</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Foto (opcional)</FormLabel>
                        <div className="flex items-center space-x-3">
                          <div className="h-14 w-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                            <User />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                          <Input 
                            type="hidden" 
                            {...field} 
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start space-x-2">
                <InfoIcon className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Código de acesso será gerado automaticamente</p>
                  <p className="mt-1">Um QR Code e código de barras serão criados para este funcionário após o cadastro. Você poderá imprimir estes códigos para crachás de identificação.</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-blue-600 text-white"
                >
                  {selectedEmployee ? "Atualizar Funcionário" : "Cadastrar Funcionário"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // Show QR Code after successful registration
          <div className="py-4">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-2">QR Code Gerado com Sucesso</h3>
              <p className="text-gray-600 text-center mb-4">
                Este QR Code pode ser utilizado para o registro de ponto do funcionário.
                Você pode salvar ou imprimir este código.
              </p>
              
              {qrCodeUrl && (
                <div className="border border-gray-300 rounded-md p-4 mb-6">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code do funcionário" 
                    className="max-w-full h-auto mx-auto" 
                    style={{ width: '250px', height: '250px' }}
                  />
                </div>
              )}
              
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  onClick={() => qrCodeUrl && window.open(qrCodeUrl, '_blank')}
                  disabled={!qrCodeUrl}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-primary"
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar QR Code
                </Button>
                <Button 
                  onClick={handleDoneWithQRCode}
                  className="bg-primary hover:bg-blue-600 text-white"
                >
                  Concluir
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Importing the missing Download icon
function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
