"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { fetchAndStoreProfile } from "@/services/profileService";
import { getAuthToken } from "@/services/cookieHelper";
import ActiveBookingBubble from "@/components/ActiveBookingBubble";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  // Sembunyikan top navbar pasien, footer pasien, dan active booking bubble pasien untuk seluruh route Nakes (/nakes/*)
  const hideLayout = pathname.startsWith("/nakes");

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

      {/* Floating bubble status booking aktif — hanya untuk pasien login */}
      {!hideLayout && <ActiveBookingBubble />}
    </>
  );
}
