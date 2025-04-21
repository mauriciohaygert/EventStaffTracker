import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useToast } from "@/hooks/use-toast";
import { EmployeeStatus, type EmployeeWithStatus } from "@shared/schema";
import { 
  Eye, 
  QrCode, 
  Clock, 
  Edit,
  Search,
  Filter,
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Employees = () => {
  const { toast } = useToast();
  const { 
    selectedEvent, 
    setShowEmployeeModal, 
    setSelectedEmployee,
    setShowActionModal,
    setShowQRScanModal
  } = useEmployeeContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState({ field: "name", direction: "asc" });
  
  const itemsPerPage = 10;
  
  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/employees', selectedEvent?.id],
    queryFn: async () => {
      const response = await fetch(`/api/employees${selectedEvent ? `?eventId=${selectedEvent.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    }
  });
  
  // Filter and sort employees
  const filteredEmployees = employees ? employees.filter((employee: EmployeeWithStatus) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter && roleFilter !== "all" ? employee.role === roleFilter : true;
    const matchesStatus = statusFilter && statusFilter !== "all" ? employee.status === statusFilter : true;
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];
  
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const fieldA = String(a[sortBy.field as keyof EmployeeWithStatus] || "");
    const fieldB = String(b[sortBy.field as keyof EmployeeWithStatus] || "");
    
    const compareResult = fieldA.localeCompare(fieldB);
    return sortBy.direction === "asc" ? compareResult : -compareResult;
  });
  
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  
  const handleFilter = () => {
    // Reset to first page when filtering
    setPage(1);
  };
  
  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.WORKING:
        return (
          <span className="status-badge status-badge-working">
            <span className="status-dot status-dot-working"></span> Trabalhando
          </span>
        );
      case EmployeeStatus.ON_BREAK:
        return (
          <span className="status-badge status-badge-break">
            <span className="status-dot status-dot-break"></span> Em pausa
          </span>
        );
      case EmployeeStatus.CHECKED_OUT:
        return (
          <span className="status-badge status-badge-out">
            <span className="status-dot status-dot-out"></span> Finalizado
          </span>
        );
      case EmployeeStatus.ABSENT:
        return (
          <span className="status-badge status-badge-absent">
            <span className="status-dot status-dot-absent"></span> Ausente
          </span>
        );
      default:
        return null;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const handleEmployeeAction = (employee: EmployeeWithStatus) => {
    setSelectedEmployee(employee);
    setShowActionModal(true);
  };
  
  const getRandomColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-primary",
      "bg-green-100 text-success",
      "bg-red-100 text-danger",
      "bg-purple-100 text-purple-600",
      "bg-yellow-100 text-yellow-600"
    ];
    
    // Use the name to pick a consistent color
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Gerenciamento de Funcionários</h2>
        <Button
          onClick={() => setShowEmployeeModal(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center"
        >
          <span className="mr-2">+</span> Adicionar Funcionário
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow md:max-w-md">
            <Input
              type="text"
              placeholder="Buscar funcionários..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 w-full sm:w-auto">
                <SelectValue placeholder="Todos os Departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                <SelectItem value="Segurança">Segurança</SelectItem>
                <SelectItem value="Recepção">Recepção</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Atendimento">Atendimento</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 w-full sm:w-auto">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="working">Trabalhando</SelectItem>
                <SelectItem value="on_break">Em Pausa</SelectItem>
                <SelectItem value="checked_out">Saída</SelectItem>
                <SelectItem value="absent">Ausente</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleFilter}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
            >
              <Filter className="h-4 w-4 mr-2" /> Filtrar
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Funcionário 
                    {sortBy.field === "name" && (sortBy.direction === "asc" ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />)}
                  </div>
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    ID 
                    {sortBy.field === "id" && (sortBy.direction === "asc" ? <ChevronDown className="h-4 w-4 ml-1 text-gray-400" /> : <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />)}
                  </div>
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    Função 
                    {sortBy.field === "role" && (sortBy.direction === "asc" ? <ChevronDown className="h-4 w-4 ml-1 text-gray-400" /> : <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />)}
                  </div>
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Status 
                    {sortBy.field === "status" && (sortBy.direction === "asc" ? <ChevronDown className="h-4 w-4 ml-1 text-gray-400" /> : <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />)}
                  </div>
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("checkInTime")}
                  >
                    Entrada 
                    {sortBy.field === "checkInTime" && (sortBy.direction === "asc" ? <ChevronDown className="h-4 w-4 ml-1 text-gray-400" /> : <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />)}
                  </div>
                </th>
                <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Skeleton loaders for employees
                Array(5).fill(null).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-medium ${getRandomColor(employee.name)}`}>
                          {getInitials(employee.name)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      EMP{String(employee.id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {employee.role}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {employee.checkInTime || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            toast({
                              title: "Detalhes do funcionário",
                              description: `Visualizando ${employee.name}`,
                            });
                          }}
                          className="text-primary hover:text-blue-700"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowQRScanModal(true);
                          }}
                          className="text-success hover:text-green-700"
                          title="Verificar QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEmployeeAction(employee)}
                          className="text-warning hover:text-orange-700"
                          title="Registrar atividade"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm || roleFilter || statusFilter ? 
                      "Nenhum funcionário encontrado com os filtros aplicados." : 
                      "Nenhum funcionário cadastrado. Clique em 'Adicionar Funcionário' para começar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {paginatedEmployees.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(page * itemsPerPage, sortedEmployees.length)}</span> de <span className="font-medium">{sortedEmployees.length}</span> resultados
              </div>
              <div className="flex space-x-1">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Anterior</span>
                </Button>
                
                {/* Page buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-md border ${
                        page === pageNum
                          ? "border-gray-300 bg-primary text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Próximo</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Employees;
