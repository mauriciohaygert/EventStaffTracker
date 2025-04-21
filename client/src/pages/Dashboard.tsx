import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmployeeContext } from "@/context/EmployeeContext";
import StatCard from "@/components/StatCard";
import QuickActions from "@/components/QuickActions";
import RecentActivity from "@/components/RecentActivity";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { selectedEvent, setSelectedEvent } = useEmployeeContext();
  
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats', selectedEvent?.id], 
    queryFn: async () => {
      const response = await fetch(`/api/stats${selectedEvent ? `?eventId=${selectedEvent.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!events
  });

  return (
    <section className="mb-12">
      {/* Header with event selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Evento Atual:</span>
          <Select
            value={selectedEvent?.id?.toString() || ""}
            onValueChange={(value) => {
              const event = events?.find(e => e.id.toString() === value);
              setSelectedEvent(event || null);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          // Skeleton loaders for stats
          Array(4).fill(null).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title="Funcionários Ativos"
              value={stats?.activeEmployees || 0}
              icon="user"
              color="primary"
              trend="+8%"
              trendLabel="do evento anterior"
              trendUp={true}
            />
            <StatCard 
              title="Presentes Hoje"
              value={stats?.activeEmployees + stats?.onBreakEmployees || 0}
              icon="userCheck"
              color="success"
              trend={`${stats?.attendanceRate || 0}%`}
              trendLabel="de comparecimento"
              trendUp={true}
            />
            <StatCard 
              title="Em Pausa"
              value={stats?.onBreakEmployees || 0}
              icon="coffee"
              color="warning"
              trend={`${stats?.breakRate || 0}%`}
              trendLabel="do staff presente"
              trendUp={null}
            />
            <StatCard 
              title="Ausentes"
              value={stats?.absentEmployees || 0}
              icon="userX"
              color="danger"
              trend={`${stats?.absentRate || 0}%`}
              trendLabel="do total esperado"
              trendUp={false}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity eventId={selectedEvent?.id} />
    </section>
  );
};

export default Dashboard;
