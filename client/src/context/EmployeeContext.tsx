import { createContext, useState, useContext, ReactNode } from "react";
import { type EmployeeWithStatus, type Event } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface EmployeeContextType {
  // Modal states
  showQRScanModal: boolean;
  setShowQRScanModal: (show: boolean) => void;
  
  showEmployeeModal: boolean;
  setShowEmployeeModal: (show: boolean) => void;
  
  showActionModal: boolean;
  setShowActionModal: (show: boolean) => void;
  
  // Selected employee and event
  selectedEmployee: EmployeeWithStatus | null;
  setSelectedEmployee: (employee: EmployeeWithStatus | null) => void;
  
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  // Modal states
  const [showQRScanModal, setShowQRScanModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Selected employee and event
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithStatus | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Fetch events on initial load to set default selected event
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
    onSuccess: (data) => {
      // If we have events and no selected event, set the first one as selected
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    }
  });
  
  return (
    <EmployeeContext.Provider
      value={{
        showQRScanModal,
        setShowQRScanModal,
        showEmployeeModal,
        setShowEmployeeModal,
        showActionModal,
        setShowActionModal,
        selectedEmployee,
        setSelectedEmployee,
        selectedEvent,
        setSelectedEvent
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useEmployeeContext must be used within an EmployeeProvider");
  }
  return context;
};
