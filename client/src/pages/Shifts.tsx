import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, Filter, Download } from "lucide-react";

const Shifts = () => {
  const { selectedEvent } = useEmployeeContext();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState("day");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  
  // Fetch time records
  const { data: timeRecords, isLoading } = useQuery({
    queryKey: ['/api/time-records', selectedEvent?.id, date],
    queryFn: async () => {
      const response = await fetch(`/api/time-records?eventId=${selectedEvent?.id || ''}&date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch time records');
      return response.json();
    },
    enabled: !!selectedEvent
  });
  
  // Fetch employees for the filter
  const { data: employees } = useQuery({
    queryKey: ['/api/employees', selectedEvent?.id],
    enabled: !!selectedEvent
  });
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  // Group records by employee
  const groupedByEmployee = timeRecords ? timeRecords.reduce((acc: any, record: any) => {
    if (!acc[record.employeeId]) {
      acc[record.employeeId] = [];
    }
    acc[record.employeeId].push(record);
    return acc;
  }, {}) : {};
  
  // Calculate work hours for each employee
  const calculateWorkHours = (employeeRecords: any[]) => {
    let totalMinutes = 0;
    let checkInTime = null;
    let breakStartTime = null;
    
    // Sort records by timestamp
    const sortedRecords = [...employeeRecords].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i];
      
      if (record.recordType === 'check_in') {
        checkInTime = new Date(record.timestamp);
      } else if (record.recordType === 'check_out' && checkInTime) {
        const checkOutTime = new Date(record.timestamp);
        totalMinutes += (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
        checkInTime = null;
      } else if (record.recordType === 'break_start') {
        breakStartTime = new Date(record.timestamp);
      } else if (record.recordType === 'break_end' && breakStartTime) {
        // We don't add break time to total work hours
        breakStartTime = null;
      }
    }
    
    // If still checked in without checkout
    if (checkInTime && !breakStartTime) {
      const now = new Date();
      totalMinutes += (now.getTime() - checkInTime.getTime()) / (1000 * 60);
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Turnos de Trabalho</h2>
        <Button 
          className="bg-primary hover:bg-blue-600 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Controle de Horas</CardTitle>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
              <Button variant="outline" className="gap-1">
                <Calendar className="h-4 w-4" />
                Hoje
              </Button>
            </div>
          </div>
          <CardDescription>
            {formatDate(date)}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs value={view} onValueChange={setView} className="mb-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar funcionário..." 
                className="pl-9 w-64"
              />
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {employees?.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="day" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(null).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-40 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                Array.isArray(employees) && employees.length > 0 ? (
                  <div className="space-y-4">
                    {employees
                      .filter((employee: any) => employeeFilter === "all" || employee.id.toString() === employeeFilter)
                      .map((employee: any) => {
                        const employeeRecords = groupedByEmployee[employee.id] || [];
                        const hasRecords = employeeRecords.length > 0;
                        
                        // Find specific record types
                        const checkIn = employeeRecords.find((r: any) => r.recordType === 'check_in');
                        const checkOut = employeeRecords.find((r: any) => r.recordType === 'check_out');
                        const breakStart = employeeRecords.find((r: any) => r.recordType === 'break_start');
                        const breakEnd = employeeRecords.find((r: any) => r.recordType === 'break_end');
                        
                        const workHours = hasRecords ? calculateWorkHours(employeeRecords) : '0h 0m';
                        
                        return (
                          <div key={employee.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-primary font-medium bg-blue-100`}>
                                  {employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <h3 className="font-medium">{employee.name}</h3>
                                  <p className="text-sm text-gray-500">{employee.role}</p>
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                Horas trabalhadas: <span className="text-primary">{workHours}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                              <div className="flex flex-col border rounded p-2">
                                <span className="text-xs text-gray-500 mb-1">Entrada</span>
                                <span className="font-medium text-sm">
                                  {checkIn ? new Date(checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                              </div>
                              <div className="flex flex-col border rounded p-2">
                                <span className="text-xs text-gray-500 mb-1">Início de Pausa</span>
                                <span className="font-medium text-sm">
                                  {breakStart ? new Date(breakStart.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                              </div>
                              <div className="flex flex-col border rounded p-2">
                                <span className="text-xs text-gray-500 mb-1">Fim de Pausa</span>
                                <span className="font-medium text-sm">
                                  {breakEnd ? new Date(breakEnd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                              </div>
                              <div className="flex flex-col border rounded p-2">
                                <span className="text-xs text-gray-500 mb-1">Saída</span>
                                <span className="font-medium text-sm">
                                  {checkOut ? new Date(checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum funcionário cadastrado para este evento.
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                A visualização semanal será implementada em breve.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="month" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                A visualização mensal será implementada em breve.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Shifts;
