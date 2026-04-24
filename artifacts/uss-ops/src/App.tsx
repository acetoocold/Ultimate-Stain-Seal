import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { OpsLayout } from "@/components/layout/ops-layout";
import OpsDashboard from "@/pages/ops/dashboard";
import OpsLogin from "@/pages/ops/login";
import CustomersList from "@/pages/ops/customers";
import CustomerDetail from "@/pages/ops/customers/detail";
import ProjectsList from "@/pages/ops/projects";
import ProjectDetail from "@/pages/ops/projects/detail";
import DiagnosisList from "@/pages/ops/diagnosis";
import DiagnosisDetail from "@/pages/ops/diagnosis/detail";
import InvoicesList from "@/pages/ops/invoices";
import InvoiceDetail from "@/pages/ops/invoices/detail";
import SchedulePage from "@/pages/ops/schedule";
import MaterialsPage from "@/pages/ops/materials";
import JobsheetsPage from "@/pages/ops/jobsheets";
import JobsheetDetail from "@/pages/ops/jobsheets/detail";
import ReportsDashboard from "@/pages/ops/reports";
import ActivityPage from "@/pages/ops/activity";
import SettingsPage from "@/pages/ops/settings";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 p-8 h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">This module is under construction.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/ops/dashboard" />} />
      
      {/* Customer Portal Routes */}
      <Route path="/customer/login" component={() => <Placeholder title="Customer Login" />} />
      <Route path="/customer/register" component={() => <Placeholder title="Customer Register" />} />
      <Route path="/customer/portal" component={() => <Placeholder title="Customer Portal" />} />
      <Route path="/customer/projects" component={() => <Placeholder title="Customer Projects" />} />
      <Route path="/customer/projects/:id" component={() => <Placeholder title="Customer Project Detail" />} />
      <Route path="/customer/invoices" component={() => <Placeholder title="Customer Invoices" />} />
      <Route path="/customer/invoices/:id" component={() => <Placeholder title="Customer Invoice Detail" />} />
      <Route path="/customer/documents" component={() => <Placeholder title="Customer Documents" />} />
      <Route path="/customer/profile" component={() => <Placeholder title="Customer Profile" />} />

      {/* Employee/Admin Routes */}
      <Route path="/ops/login" component={OpsLogin} />
      
      <Route path="/ops/*">
        <OpsLayout>
          <Switch>
            <Route path="/ops/dashboard" component={OpsDashboard} />
            
            {/* Customers */}
            <Route path="/ops/customers" component={CustomersList} />
            <Route path="/ops/customers/new" component={() => <Placeholder title="New Customer" />} />
            <Route path="/ops/customers/:id" component={CustomerDetail} />
            
            {/* Projects */}
            <Route path="/ops/projects" component={ProjectsList} />
            <Route path="/ops/projects/new" component={() => <Placeholder title="New Project" />} />
            <Route path="/ops/projects/:id" component={ProjectDetail} />
            
            {/* Diagnoses */}
            <Route path="/ops/diagnosis" component={DiagnosisList} />
            <Route path="/ops/diagnosis/new" component={() => <Placeholder title="New Diagnosis" />} />
            <Route path="/ops/diagnosis/:id" component={DiagnosisDetail} />
            
            {/* Schedule & Jobs */}
            <Route path="/ops/schedule" component={SchedulePage} />
            <Route path="/ops/jobs/new" component={() => <Placeholder title="New Job" />} />
            <Route path="/ops/jobs/:id" component={() => <Placeholder title="Job Detail" />} />
            
            {/* Invoices */}
            <Route path="/ops/invoices" component={InvoicesList} />
            <Route path="/ops/invoices/new" component={() => <Placeholder title="New Invoice" />} />
            <Route path="/ops/invoices/:id" component={InvoiceDetail} />
            
            {/* Payments */}
            <Route path="/ops/payments" component={() => <Placeholder title="Payments" />} />
            <Route path="/ops/payments/new" component={() => <Placeholder title="New Payment" />} />
            
            {/* Materials & Inventory */}
            <Route path="/ops/materials" component={MaterialsPage} />
            <Route path="/ops/materials/new" component={() => <Placeholder title="New Material" />} />
            <Route path="/ops/inventory" component={MaterialsPage} />
            
            {/* Jobsheets / Work Orders */}
            <Route path="/ops/jobsheets" component={JobsheetsPage} />
            <Route path="/ops/jobsheets/new" component={() => <Placeholder title="New Jobsheet" />} />
            <Route path="/ops/jobsheets/:id" component={JobsheetDetail} />
            
            {/* Reports */}
            <Route path="/ops/reports" component={ReportsDashboard} />
            
            {/* Activity Log */}
            <Route path="/ops/activity" component={ActivityPage} />
            
            {/* Documents */}
            <Route path="/ops/documents" component={() => <Placeholder title="Documents" />} />
            
            {/* Settings & Config */}
            <Route path="/ops/settings" component={SettingsPage} />
            <Route path="/ops/pricing-rules" component={SettingsPage} />
            
            <Route component={NotFound} />
          </Switch>
        </OpsLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
