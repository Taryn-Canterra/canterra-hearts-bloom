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
import ResetPassword from "./pages/ResetPassword.tsx";
import DashboardOverview from "./pages/dashboard/Overview.tsx";
import Leads from "./pages/dashboard/Leads.tsx";
import Deals from "./pages/dashboard/Deals.tsx";
import NewDeal from "./pages/dashboard/NewDeal.tsx";
import DealDetail from "./pages/dashboard/DealDetail.tsx";
import DashboardCalendar from "./pages/dashboard/Calendar.tsx";
import PortalCalendar from "./pages/portal/PortalCalendar.tsx";
import AgentAITools from "./pages/dashboard/AgentAITools.tsx";
import RoutingRules from "./pages/dashboard/RoutingRules.tsx";
import ListingClaims from "./pages/dashboard/ListingClaims.tsx";
import Templates from "./pages/dashboard/Templates.tsx";
import TemplateEditor from "./pages/dashboard/TemplateEditor.tsx";
import PortalHome from "./pages/portal/PortalHome.tsx";
import PortalDeal from "./pages/portal/PortalDeal.tsx";
import PortalCollections from "./pages/portal/PortalCollections.tsx";
import PortalCollectionDetail from "./pages/portal/PortalCollectionDetail.tsx";
import PortalSearches from "./pages/portal/PortalSearches.tsx";
import Vendors from "./pages/Vendors.tsx";
import VendorDetail from "./pages/VendorDetail.tsx";
import VendorLists from "./pages/dashboard/VendorLists.tsx";
import VendorListEditor from "./pages/dashboard/VendorListEditor.tsx";
import PortalSavedVendors from "./pages/portal/PortalSavedVendors.tsx";
import SharedCollection from "./pages/SharedCollection.tsx";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            <Route path="/c/:token" element={<SharedCollection />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/dashboard/leads" element={<Leads />} />
            <Route path="/dashboard/deals" element={<Deals />} />
            <Route path="/dashboard/deals/new" element={<NewDeal />} />
            <Route path="/dashboard/deals/:id" element={<DealDetail />} />
            <Route path="/dashboard/calendar" element={<DashboardCalendar />} />
            <Route path="/dashboard/ai-tools" element={<AgentAITools />} />
            <Route path="/dashboard/routing" element={<RoutingRules />} />
            <Route path="/dashboard/claims" element={<ListingClaims />} />
            <Route path="/dashboard/templates" element={<Templates />} />
            <Route path="/dashboard/templates/:id" element={<TemplateEditor />} />
            <Route path="/dashboard/vendor-lists" element={<VendorLists />} />
            <Route path="/dashboard/vendor-lists/:id" element={<VendorListEditor />} />
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/calendar" element={<PortalCalendar />} />
            <Route path="/portal/deal/:id" element={<PortalDeal />} />
            <Route path="/portal/collections" element={<PortalCollections />} />
            <Route path="/portal/collections/:id" element={<PortalCollectionDetail />} />
            <Route path="/portal/searches" element={<PortalSearches />} />
            <Route path="/portal/saved-vendors" element={<PortalSavedVendors />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
