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
import AdminUsers from "@/pages/AdminUsers";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

import { EmployeeProvider } from "@/context/EmployeeContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  // Preload events for the whole application
  useEffect(() => {
    queryClient.prefetchQuery({ 
      queryKey: ['/api/events']
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <EmployeeProvider>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              
              <ProtectedRoute path="/" component={() => (
                <Layout>
                  <Dashboard />
                </Layout>
              )} />

              <ProtectedRoute path="/employees" component={() => (
                <Layout>
                  <Employees />
                </Layout>
              )} />

              <ProtectedRoute path="/shifts" component={() => (
                <Layout>
                  <Shifts />
                </Layout>
              )} />

              <ProtectedRoute path="/reports" component={() => (
                <Layout>
                  <Reports />
                </Layout>
              )} />

              <ProtectedRoute 
                path="/admin/users" 
                component={() => (
                  <Layout>
                    <AdminUsers />
                  </Layout>
                )} 
                roles={["admin"]}
              />
              
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </EmployeeProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
