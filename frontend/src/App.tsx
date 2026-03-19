import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardRedirect from "./pages/DashboardRedirect";
import DashboardHome from "./pages/dashboard/DashboardHome";
import BuyerEnterpriseDashboard from "./pages/dashboard/BuyerEnterpriseDashboard";
import PerformanceAnalytics from "./pages/dashboard/PerformanceAnalytics";
import MyFarm from "./pages/dashboard/MyFarm";
import MyProducts from "./pages/dashboard/MyProducts";
import Marketplace from "./pages/dashboard/Marketplace";
import Orders from "./pages/dashboard/Orders";
import AIScanner from "./pages/dashboard/AIScanner";
import CropCalendar from "./pages/dashboard/CropCalendar";
import Community from "./pages/dashboard/Community";
import Messages from "./pages/dashboard/Messages";
import UpgradePlan from "./pages/dashboard/UpgradePlan";
import Profile from "./pages/dashboard/Profile";
import NotFound from "./pages/NotFound";

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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/dashboard/free" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/pro" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/enterprise" element={<ProtectedRoute><BuyerEnterpriseDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><PerformanceAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/farm" element={<ProtectedRoute><MyFarm /></ProtectedRoute>} />
            <Route path="/dashboard/products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
            <Route path="/dashboard/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/ai-scanner" element={<ProtectedRoute><AIScanner /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute><CropCalendar /></ProtectedRoute>} />
            <Route path="/dashboard/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/upgrade" element={<ProtectedRoute><UpgradePlan /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
