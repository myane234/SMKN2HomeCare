"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
    FiSearch,
    FiMenu, 
    FiX, 
    FiHome, 
    FiGrid, 
    FiActivity, 
    FiInfo,
    FiPercent,
    FiBook,
    FiUsers,
    FiUserCheck,
    FiLogIn,
    FiCalendar
} from "react-icons/fi";
import { getLayanan } from "@/services/layananService";

export default function Navbar() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        if (typeof document !== "undefined") {
            return document.cookie.includes("is_logged_in=true");
        }
        return false;
    });
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchData, setSearchData] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPathname, setCurrentPathname] = useState(pathname);
    const searchInputRef = useRef(null);
    const originalNavRef = useRef(null);

    // Adjust state during render when pathname changes (recommended React pattern)
    if (currentPathname !== pathname) {
        setCurrentPathname(pathname);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
    }

    useEffect(() => {
        const handleScroll = () => {
            if (originalNavRef.current) {
                const navHeight = originalNavRef.current.offsetHeight;
                // Show sticky navbar when original navbar is completely scrolled away
                if (window.scrollY > navHeight) {
                    setIsStickyVisible(true);
                } else {
                    setIsStickyVisible(false);
                }
            }
        };
        
        window.addEventListener("scroll", handleScroll, { passive: true });
        // Initial check
        handleScroll();
        
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!isSearchOpen) return;

        let isCancelled = false;
        async function fetchServices() {
            setSearchLoading(true);
            try {
                const response = await getLayanan();
                if (isCancelled) return;
                const payload = response?.data ?? response ?? [];
                const services = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
                setSearchData(services);
            } catch (error) {
                if (isCancelled) return;
                console.error("Gagal memuat data layanan untuk pencarian", error);
                setSearchData([]);
            } finally {
                if (!isCancelled) setSearchLoading(false);
            }
        }
        fetchServices();

        return () => {
            isCancelled = true;
        };
    }, [isSearchOpen]);

    function slugify(text) {
        return text?.toLowerCase().replace(/&/g, "dan").replace(/\s+/g, "-").replace(/(^-|-$)/g, "") || "";
    }

    const searchItems = searchData.map(service => ({
        name: service.nama_layanan || service.nama || service.title || "",
        category: service.kategori_layanan || service.kategori || service.category || "",
        href: `/layanan/${slugify(service.kategori_layanan || service.kategori || service.category)}/${slugify(service.nama_layanan || service.nama || service.title)}`
    }));

    const filteredSearchItems = searchQuery.trim() === ""
        ? []
        : searchItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Render navbar content helper to avoid duplication without recreating component during render
    const renderNavbarContent = (isSticky = false) => (
        <>
            {/* Logo */}
            <Link href="/" className={`shrink-0 flex items-center transition-all duration-300 ease-in-out hover:opacity-80 ${isSticky ? 'scale-95' : ''}`}>
                <Image 
                    src="/images/logo/logo.png"
                    alt="SmartHomeCare Logo"
                    width={140}
                    height={50}
                    priority
                    className={`w-auto transition-all duration-300 ease-in-out ${
                        isSticky 
                            ? "h-7 sm:h-8 lg:h-8 xl:h-9" 
                            : "h-8 sm:h-9 lg:h-9 xl:h-11"
                    }`}
                />
            </Link>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-1.5 font-medium text-gray-700">
                <li>
                    <Link 
                        href="/" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname === "/" 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Beranda
                        {pathname === "/" && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/tentang-kami" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname === "/tentang-kami" 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Tentang Kami
                        {pathname === "/tentang-kami" && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/promo" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/promo") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Promo
                        {pathname.startsWith("/promo") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/layanan" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/layanan") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Layanan
                        {pathname.startsWith("/layanan") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/pesan-laynan" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/pesan-laynan") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Pesan Layanan
                        {pathname.startsWith("/pesan-laynan") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/artikel" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/artikel") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Artikel
                        {pathname.startsWith("/artikel") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/ulasan" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/ulasan") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Ulasan
                        {pathname.startsWith("/ulasan") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/hubungi-kami" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname === "/hubungi-kami" 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Hubungi Kami
                        {pathname === "/hubungi-kami" && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/gabung-mitra" 
                        className={`relative px-2 py-1.5 xl:px-3 2xl:px-4 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-white/60 ${
                            pathname.startsWith("/gabung-mitra") 
                                ? "text-green-600 font-semibold" 
                                : "text-gray-600 hover:text-green-600"
                        }`}
                    >
                        Gabung Mitra
                        {pathname.startsWith("/gabung-mitra") && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 xl:w-5 h-0.5 bg-green-500 rounded-full" />
                        )}
                    </Link>
                </li>
            </ul>

            {/* Right Area */}
            <div className="hidden lg:flex items-center text-gray-700 gap-1.5 xl:gap-2 shrink-0">
                <button 
                    onClick={() => setIsSearchOpen(true)} 
                    className="cursor-pointer p-2 xl:p-2.5 rounded-lg hover:bg-white/60 transition-all duration-300 ease-in-out hover:text-green-600 hover:scale-105 active:scale-95 text-gray-700"
                    aria-label="Cari Layanan"
                >
                    <FiSearch className="w-4 h-4 xl:w-5 xl:h-5" />
                </button>
                
                {isLoggedIn ? (
                    <Link 
                        href="/profile" 
                        className="p-2 xl:p-2.5 rounded-lg hover:bg-white/60 transition-all duration-300 ease-in-out hover:text-green-600 hover:scale-105 active:scale-95 text-gray-700"
                    >
                        <FiUsers className="w-4 h-4 xl:w-5 xl:h-5" />
                    </Link>
                ) : (
                    <Link href="/login">
                        <button className="rounded-lg bg-green-500 px-3.5 py-1.5 xl:px-5 xl:py-2 text-xs xl:text-sm font-semibold text-white whitespace-nowrap transition-all duration-300 ease-in-out hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95">
                            Masuk
                        </button>
                    </Link>
                )}
            </div>

            {/* Mobile / Tablet Trigger */}
            <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-gray-700 p-2 rounded-lg hover:bg-white/60 transition-all duration-300 ease-in-out hover:text-green-600 hover:scale-105 active:scale-95"
                    aria-label="Cari Layanan"
                >
                    <FiSearch className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-gray-700 p-2 rounded-lg hover:bg-white/60 transition-all duration-300 ease-in-out hover:text-green-600 hover:scale-105 active:scale-95 focus:outline-none"
                    aria-label="Menu"
                >
                    {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Original Navbar - Visible at top, scrolls away naturally */}
            <div ref={originalNavRef} className="relative z-40">
                <nav className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 md:py-4 bg-blue-100 shadow-sm">
                    <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
                        {renderNavbarContent(false)}
                    </div>
                </nav>
            </div>

            {/* Sticky Navbar - Appears after original navbar scrolls away */}
            <nav 
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
                    isStickyVisible 
                        ? "opacity-100 translate-y-0 pointer-events-auto" 
                        : "opacity-0 -translate-y-full pointer-events-none"
                }`}
            >
                <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 md:py-3 bg-blue-100/95 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
                    <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
                        {renderNavbarContent(true)}
                    </div>
                </div>
            </nav>

            {/* Mobile & Tablet Dropdown / Drawer Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="fixed inset-x-0 bottom-[64px] sm:bottom-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md top-[58px] sm:top-0 bg-white overflow-y-auto shadow-2xl p-6 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 sm:pt-20 animate-slide-down">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between sm:hidden pb-2 border-b border-gray-100">
                                <span className="font-bold text-gray-800 text-base">Menu Navigasi</span>
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <ul className="space-y-1 font-semibold text-base text-gray-800">
                                <li>
                                    <Link 
                                        href="/" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname === "/" 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiHome size={18} />
                                        <span>Beranda</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/tentang-kami" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname === "/tentang-kami" 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiInfo size={18} />
                                        <span>Tentang Kami</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/promo" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/promo") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiPercent size={18} />
                                        <span>Promo</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/layanan" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/layanan") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiActivity size={18} />
                                        <span>Layanan</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/pesan-laynan" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/pesan-laynan") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiCalendar size={18} />
                                        <span>Pesan Layanan</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/artikel" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/artikel") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiBook size={18} />
                                        <span>Artikel</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/ulasan" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/ulasan") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiGrid size={18} />
                                        <span>Ulasan</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/hubungi-kami" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname === "/hubungi-kami" 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiInfo size={18} />
                                        <span>Hubungi Kami</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/gabung-mitra" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                            pathname.startsWith("/gabung-mitra") 
                                                ? "bg-green-50 text-green-600 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                        }`}
                                    >
                                        <FiUsers size={18} />
                                        <span>Gabung Mitra</span>
                                    </Link>
                                </li>
                                {isLoggedIn && (
                                    <li>
                                        <Link 
                                            href="/profile" 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                                                pathname === "/profile" 
                                                    ? "bg-green-50 text-green-600 font-bold" 
                                                    : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                            }`}
                                        >
                                            <FiUserCheck size={18} />
                                            <span>Profil Saya</span>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                        {!isLoggedIn && (
                            <div className="mt-6 border-t border-gray-100 pt-5">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white transition-all duration-300 ease-in-out hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-98">
                                        <FiLogIn size={18} />
                                        <span>Masuk Akun</span>
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fixed Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/80 py-2 px-4 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                <div className="flex justify-around items-center max-w-md mx-auto text-gray-500">
                    <Link 
                        href="/" 
                        className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-all duration-300 ease-in-out group ${
                            pathname === "/" 
                                ? "text-green-600 font-bold" 
                                : "hover:text-green-600"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ease-in-out ${
                            pathname === "/" 
                                ? "bg-green-50" 
                                : "group-hover:bg-green-50/50"
                        }`}>
                            <FiHome className={`w-5 h-5 transition-all duration-300 ${
                                pathname === "/" ? "stroke-[2.5]" : "stroke-2"
                            }`} />
                        </div>
                        <span className="transition-colors duration-300">Beranda</span>
                    </Link>

                    <Link 
                        href="/layanan" 
                        className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-all duration-300 ease-in-out group ${
                            pathname.startsWith("/layanan") 
                                ? "text-green-600 font-bold" 
                                : "hover:text-green-600"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ease-in-out ${
                            pathname.startsWith("/layanan") 
                                ? "bg-green-50" 
                                : "group-hover:bg-green-50/50"
                        }`}>
                            <FiGrid className={`w-5 h-5 transition-all duration-300 ${
                                pathname.startsWith("/layanan") ? "stroke-[2.5]" : "stroke-2"
                            }`} />
                        </div>
                        <span className="transition-colors duration-300">Layanan</span>
                    </Link>

                    <Link 
                        href="/pesan-laynan" 
                        className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-all duration-300 ease-in-out group ${
                            pathname.startsWith("/pesan-laynan") 
                                ? "text-green-600 font-bold" 
                                : "hover:text-green-600"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ease-in-out ${
                            pathname.startsWith("/pesan-laynan") 
                                ? "bg-green-50" 
                                : "group-hover:bg-green-50/50"
                        }`}>
                            <FiCalendar className={`w-5 h-5 transition-all duration-300 ${
                                pathname.startsWith("/pesan-laynan") ? "stroke-[2.5]" : "stroke-2"
                            }`} />
                        </div>
                        <span className="transition-colors duration-300">Pesan</span>
                    </Link>

                    <Link
                        href={isLoggedIn ? "/profile" : "/login"}
                        className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-all duration-300 ease-in-out group ${
                            (pathname === "/profile" || pathname === "/login")
                            ? "text-green-600 font-semibold"
                            : "hover:text-green-600"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ease-in-out ${
                            (pathname === "/profile" || pathname === "/login")
                                ? "bg-green-50" 
                                : "group-hover:bg-green-50/50"
                        }`}>
                            <FiUsers
                                className={`w-5 h-5 transition-all duration-300 ${
                                    (pathname === "/profile" || pathname === "/login")
                                        ? "stroke-[2.5]"
                                        : "stroke-2"
                                }`}
                            />
                        </div>
                        <span className="transition-colors duration-300">{isLoggedIn ? "Profil" : "Masuk"}</span>
                    </Link>
                </div>
            </nav>

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 transition-opacity duration-300 ease-in-out">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative overflow-hidden border border-slate-100/80 animate-scale-up">
                        <button 
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 ease-in-out cursor-pointer hover:scale-110 active:scale-95"
                            aria-label="Tutup"
                        >
                            <FiX size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiSearch className="text-green-500" />
                            Cari Layanan Homecare
                        </h3>

                        <div className="relative mb-6">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ketik nama layanan (misal: Pijat Bayi, Luka)..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 ease-in-out text-base placeholder:text-gray-400"
                            />
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>

                        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {searchLoading ? (
                                <div className="text-center py-8 text-gray-400">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mb-2" />
                                    <p className="font-medium text-sm">Memuat data layanan...</p>
                                </div>
                            ) : searchQuery.trim() === "" ? (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Rekomendasi Layanan</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { name: "Pijat Bayi", href: "/layanan/ibu-anak/pijat-bayi" },
                                            { name: "Perawatan Luka", href: "/layanan/perawatan-luka" },
                                            { name: "Medical Check Up", href: "/layanan/medical-check-up" },
                                            { name: "Fisioterapi", href: "/layanan/fisioterapi" },
                                        ].map((rec) => (
                                            <Link
                                                key={rec.name}
                                                href={rec.href}
                                                onClick={() => {
                                                    setIsSearchOpen(false);
                                                    setSearchQuery("");
                                                }}
                                                className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 ease-in-out text-sm text-gray-700 font-medium hover:scale-[1.02] active:scale-98"
                                            >
                                                <FiActivity className="text-green-500 flex-shrink-0" />
                                                <span className="truncate">{rec.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : filteredSearchItems.length > 0 ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hasil Pencarian ({filteredSearchItems.length})</p>
                                    {filteredSearchItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => {
                                                setIsSearchOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-slate-200 transition-all duration-300 ease-in-out group hover:scale-[1.01] active:scale-98"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0">
                                                    SHC
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-300">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                Lihat →
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="font-medium text-sm">Layanan tidak ditemukan</p>
                                    <p className="text-xs mt-1">Coba gunakan kata kunci lain</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global animation styles */}
            <style jsx global>{`
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scale-up {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-slide-down {
                    animation: slide-down 0.3s ease-in-out forwards;
                }
                
                .animate-scale-up {
                    animation: scale-up 0.3s ease-in-out forwards;
                }

                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 9999px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </>
    );
}