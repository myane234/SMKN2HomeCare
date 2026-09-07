"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { fetchAndStoreProfile } from "@/services/profileService";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  const hideLayout =
    pathname.startsWith("/nakes/dashboard");

  useEffect(() => {
    // Fetch and store profile data in cookies when page loads,
    // but only if user is logged in (has auth_token)
    const isLoggedIn = document.cookie.includes("auth_token=");
    if (isLoggedIn) {
      fetchAndStoreProfile();
    }
  }, []);

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
