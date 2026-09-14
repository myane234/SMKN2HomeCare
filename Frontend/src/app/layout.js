import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import ToastContainer from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SmartHomeCare",
  description: "SmartHomeCare",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-slate-50"
      suppressHydrationWarning={true}>
        <LayoutShell>
          {children}
        </LayoutShell>
        <ToastContainer />
      </body>
    </html>
  );
}