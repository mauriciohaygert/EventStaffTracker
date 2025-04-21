import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, BarChart2, PieChart, Users } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

const Reports = () => {
  const { selectedEvent } = useEmployeeContext();
  const [reportType, setReportType] = useState("attendance");
  
  // Fetch dashboard stats for charts
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats', selectedEvent?.id],
    queryFn: async () => {
      const response = await fetch(`/api/stats${selectedEvent ? `?eventId=${selectedEvent.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!selectedEvent
  });
  
  // Sample data for attendance by day chart
  const attendanceData = [
    { name: 'Seg', presentes: 38, ausentes: 4 },
    { name: 'Ter', presentes: 36, ausentes: 6 },
    { name: 'Qua', presentes: 40, ausentes: 2 },
    { name: 'Qui', presentes: 35, ausentes: 7 },
    { name: 'Sex', presentes: 42, ausentes: 0 },
    { name: 'Sáb', presentes: 38, ausentes: 4 },
    { name: 'Dom', presentes: 30, ausentes: 12 },
  ];
  
  // Sample data for hours worked chart
  const hoursData = [
    { name: 'Seg', horas: 304 },
    { name: 'Ter', horas: 285 },
    { name: 'Qua', horas: 320 },
    { name: 'Qui', horas: 278 },
    { name: 'Sex', horas: 336 },
    { name: 'Sáb', horas: 290 },
    { name: 'Dom', horas: 240 },
  ];
  
  // Data for status pie chart
  const statusData = stats ? [
    { name: 'Trabalhando', value: stats.activeEmployees },
    { name: 'Em Pausa', value: stats.onBreakEmployees },
    { name: 'Finalizados', value: stats.checkedOutEmployees },
    { name: 'Ausentes', value: stats.absentEmployees },
  ] : [];
  
  const COLORS = ['#3b82f6', '#f97316', '#6b7280', '#ef4444'];
  
  // Data for roles chart
  const rolesData = [
    { name: 'Segurança', value: 12 },
    { name: 'Recepção', value: 8 },
    { name: 'Técnico', value: 15 },
    { name: 'Atendimento', value: 7 },
  ];
  
  const ROLE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316'];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Relatórios</h2>
        <div className="flex items-center gap-2">
          <Select
            value={reportType}
            onValueChange={setReportType}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Selecione o tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attendance">Relatório de Presença</SelectItem>
              <SelectItem value="hours">Relatório de Horas</SelectItem>
              <SelectItem value="performance">Relatório de Desempenho</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-blue-600 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="charts" className="mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dados
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance by Day Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Presença por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={attendanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="presentes" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="ausentes" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Status Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Hours Worked Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Horas Trabalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hoursData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} horas`, 'Total']} />
                      <Legend />
                      <Bar dataKey="horas" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Roles Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribuição por Função</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={rolesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {rolesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Dados do Relatório</CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dias Presentes</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Trabalhadas</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Média Diária</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa de Presença</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample data rows */}
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-primary font-medium">
                            JD
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800">João Dias</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">Segurança</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">7/7</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">56h 30m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">8h 04m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">100%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center text-success font-medium">
                            MS
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800">Maria Silva</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">Recepção</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">6/7</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">45h 15m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">7h 32m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">86%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 bg-red-100 rounded-full flex items-center justify-center text-danger font-medium">
                            CP
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800">Carlos Pereira</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">Técnico</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">5/7</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">38h 45m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">7h 45m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">71%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-500">Mostrando 3 de 42 funcionários</p>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" disabled>Anterior</Button>
                  <Button variant="default" size="sm" className="bg-primary">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">4</Button>
                  <Button variant="outline" size="sm">5</Button>
                  <Button variant="outline" size="sm">Próximo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Funcionários</p>
                <p className="text-2xl font-semibold">{stats?.totalEmployees || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Horas</p>
                <p className="text-2xl font-semibold">2,053h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <PieChart className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taxa de Presença</p>
                <p className="text-2xl font-semibold">{stats?.attendanceRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Reports;
