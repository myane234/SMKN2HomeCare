
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

  // Sembunyikan layout pasien untuk seluruh route Nakes.
  const hideLayout = pathname.startsWith("/nakes");

  useEffect(() => {
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

      {/* Floating bubble booking aktif untuk pasien */}
      {!hideLayout && <ActiveBookingBubble />}
    </>
  );
}
