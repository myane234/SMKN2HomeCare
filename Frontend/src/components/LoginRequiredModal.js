"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { FiLock } from "react-icons/fi";

export default function LoginRequiredModal({ isOpen, onClose, message }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Clear query params by navigating to pathname (which excludes search queries)
      router.push(pathname);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Box */}
      <div 
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 sm:p-8 border border-slate-100 text-center"
        style={{
          animation: "fadeInScale 0.2s ease-out forwards",
        }}
      >
        {/* Style tag for the keyframes if Tailwind animations aren't fully configured */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}} />

        <div className="flex flex-col items-center">
          {/* Lock Icon Container */}
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-5">
            <FiLock size={30} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Login Diperlukan
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => {
                handleClose();
                router.push("/login");
              }}
              className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white transition hover:bg-green-600 active:scale-98 shadow-md shadow-green-500/10 cursor-pointer"
            >
              Login
            </button>
            
            <button
              onClick={handleClose}
              className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-98 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
