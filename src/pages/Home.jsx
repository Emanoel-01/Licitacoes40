import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function Home() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        window.location.href = "/Dashboard";
      } else {
        window.location.href = "/LandingPage";
      }
    } catch (error) {
      window.location.href = "/LandingPage";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}