import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import PaymentsPage from "@/pages/payments";
import AccountsPage from "@/pages/accounts";
import CostCentersPage from "@/pages/cost-centers";
import ReportsPage from "@/pages/reports";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={PaymentsPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/accounts" component={AccountsPage} />
        <Route path="/cost-centers" component={CostCentersPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
