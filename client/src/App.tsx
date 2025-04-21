import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Shifts from "@/pages/Shifts";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

import { EmployeeProvider } from "@/context/EmployeeContext";

function App() {
  // Preload events for the whole application
  useEffect(() => {
    queryClient.prefetchQuery({ 
      queryKey: ['/api/events']
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EmployeeProvider>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/employees" component={Employees} />
              <Route path="/shifts" component={Shifts} />
              <Route path="/reports" component={Reports} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </EmployeeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
