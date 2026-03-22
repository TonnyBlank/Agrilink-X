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
import PerformanceAnalytics from "./pages/dashboard/PerformanceAnalytics";
import MyFarm from "./pages/dashboard/MyFarm";
import MyProducts from "./pages/dashboard/MyProducts";
import Marketplace from "./pages/dashboard/Marketplace";
import Orders from "./pages/dashboard/Orders";
import AIScanner from "./pages/dashboard/AIScanner";
import CropCalendar from "./pages/dashboard/CropCalendar";
import Community from "./pages/dashboard/Community";
import Messages from "./pages/dashboard/Messages";
import MicroLoans from "./pages/dashboard/MicroLoans";
import UpgradePlan from "./pages/dashboard/UpgradePlan";
import Profile from "./pages/dashboard/Profile";
import FarmerProfile from "./pages/dashboard/FarmerProfile";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminLoans from "./pages/dashboard/admin/AdminLoans";
import AdminLoanDecisions from "./pages/dashboard/admin/AdminLoanDecisions";
import AdminTransactions from "./pages/dashboard/admin/AdminTransactions";
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const nonAdminRoles = ["farmer_free", "farmer_pro", "buyer_enterprise"] as const;

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
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/loans" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLoans /></ProtectedRoute>} />
            <Route path="/dashboard/admin/loan-decisions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLoanDecisions /></ProtectedRoute>} />
            <Route path="/dashboard/admin/transactions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTransactions /></ProtectedRoute>} />
            <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/dashboard/free" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/pro" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/enterprise" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><PerformanceAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/farm" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><MyFarm /></ProtectedRoute>} />
            <Route path="/dashboard/products" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><MyProducts /></ProtectedRoute>} />
            <Route path="/dashboard/marketplace" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><Marketplace /></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/ai-scanner" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><AIScanner /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><CropCalendar /></ProtectedRoute>} />
            <Route path="/dashboard/community" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><Community /></ProtectedRoute>} />
            <Route path="/dashboard/messages" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/micro-loans" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><MicroLoans /></ProtectedRoute>} />
            <Route path="/dashboard/upgrade" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><UpgradePlan /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard/farmers/:userId" element={<ProtectedRoute allowedRoles={[...nonAdminRoles]}><FarmerProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
