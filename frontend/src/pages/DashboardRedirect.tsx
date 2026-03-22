import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirect() {
  const { loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (role === "admin") {
        navigate("/dashboard/admin", { replace: true });
        return;
      }

      if (role === "buyer_enterprise") {
        navigate("/dashboard/enterprise", { replace: true });
        return;
      }

      if (role === "farmer_pro") {
        navigate("/dashboard/pro", { replace: true });
        return;
      }

      navigate("/dashboard/free", { replace: true });
    }
  }, [loading, navigate, role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
