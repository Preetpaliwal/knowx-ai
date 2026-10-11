"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = localStorage.getItem("isAuthenticated");
    
    if (isAuth === "true") {
      // Redirect to dashboard if authenticated
      router.push("/dashboard");
    } else {
      // Redirect to landing page if not authenticated
      router.push("/landing");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1419]">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#D4A574]" />
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
