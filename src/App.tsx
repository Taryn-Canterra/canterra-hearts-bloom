import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import ListingDetail from "./pages/ListingDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import DashboardOverview from "./pages/dashboard/Overview.tsx";
import Leads from "./pages/dashboard/Leads.tsx";
import Deals from "./pages/dashboard/Deals.tsx";
import NewDeal from "./pages/dashboard/NewDeal.tsx";
import DealDetail from "./pages/dashboard/DealDetail.tsx";
import PortalHome from "./pages/portal/PortalHome.tsx";
import PortalDeal from "./pages/portal/PortalDeal.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/dashboard/leads" element={<Leads />} />
            <Route path="/dashboard/deals" element={<Deals />} />
            <Route path="/dashboard/deals/new" element={<NewDeal />} />
            <Route path="/dashboard/deals/:id" element={<DealDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
