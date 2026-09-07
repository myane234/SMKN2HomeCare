"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { fetchAndStoreProfile } from "@/services/profileService";
import { getAuthToken } from "@/services/cookieHelper";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  const hideLayout =
    pathname.startsWith("/nakes/dashboard");

  useEffect(() => {
    // Fetch and store profile data in cookies when page loads,
    // but only if user has a valid auth token
    const token = getAuthToken();
    if (token) {
      fetchAndStoreProfile();
    }
  }, [pathname]);

  return (
    <>
      {!hideLayout && <Navbar />}

      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {!hideLayout && <Footer />}
    </>
  );
}
