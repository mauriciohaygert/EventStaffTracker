import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LogIn, 
  LogOut, 
  Coffee, 
  RefreshCw, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityProps {
  eventId?: number;
}

const RecentActivity = ({ eventId }: RecentActivityProps) => {
  // Fetch recent activity
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/recent-activity', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/recent-activity${eventId ? `?eventId=${eventId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    }
  });

  const getActivityIcon = (recordType: string) => {
    switch (recordType) {
      case 'check_in':
        return <LogIn className="h-3 w-3 mr-1" />;
      case 'check_out':
        return <LogOut className="h-3 w-3 mr-1" />;
      case 'break_start':
        return <Coffee className="h-3 w-3 mr-1" />;
      case 'break_end':
        return <RefreshCw className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };
  
  const getActivityText = (recordType: string) => {
    switch (recordType) {
      case 'check_in':
        return 'Entrada';
      case 'check_out':
        return 'Saída';
      case 'break_start':
        return 'Pausa';
      case 'break_end':
        return 'Retorno';
      default:
        return '';
    }
  };
  
  const getActivityBadgeClass = (recordType: string) => {
    switch (recordType) {
      case 'check_in':
        return 'action-badge action-badge-checkin';
      case 'check_out':
        return 'action-badge action-badge-checkout';
      case 'break_start':
        return 'action-badge action-badge-break';
      case 'break_end':
        return 'action-badge action-badge-return';
      default:
        return '';
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'working':
        return 'status-badge status-badge-working';
      case 'on_break':
        return 'status-badge status-badge-break';
      case 'checked_out':
        return 'status-badge status-badge-out';
      case 'absent':
        return 'status-badge status-badge-absent';
      default:
        return '';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return 'Trabalhando';
      case 'on_break':
        return 'Em pausa';
      case 'checked_out':
        return 'Finalizado';
      case 'absent':
        return 'Ausente';
      default:
        return '';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise, show date and time
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Atividade Recente</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-blue-700 text-sm font-medium"
          >
            Ver Tudo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Skeleton loaders for activities
                Array(4).fill(null).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : activities?.length > 0 ? (
                activities.map((activity: any) => (
                  <tr key={activity.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-medium">
                          {getInitials(activity.employee.name)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{activity.employee.name}</p>
                          <p className="text-xs text-gray-500">{activity.employee.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getActivityBadgeClass(activity.recordType)}>
                        {getActivityIcon(activity.recordType)} {getActivityText(activity.recordType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatTimestamp(activity.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getStatusBadgeClass(activity.employee.status)}>
                        {getStatusText(activity.employee.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma atividade registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
