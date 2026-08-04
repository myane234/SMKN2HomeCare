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
    FiLogIn
} from "react-icons/fi";
import { getLayanan } from "@/services/layananService";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchData, setSearchData] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        setIsLoggedIn(document.cookie.includes("is_logged_in=true"));

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close menus when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
    }, [pathname]);

    // Fetch layanan data when search opens
    useEffect(() => {
        if (isSearchOpen) {
            async function fetchServices() {
                setSearchLoading(true);
                try {
                    const response = await getLayanan();
                    const payload = response?.data ?? response ?? [];
                    const services = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
                    setSearchData(services);
                } catch (error) {
                    console.error("Gagal memuat data layanan untuk pencarian", error);
                    setSearchData([]);
                } finally {
                    setSearchLoading(false);
                }
            }
            fetchServices();
        } else {
            setSearchData([]);
            setSearchQuery("");
        }
    }, [isSearchOpen]);

// Slugify helper - harus konsisten dengan halaman detail
    function slugify(text) {
        return text?.toLowerCase().replace(/&/g, "dan").replace(/\s+/g, "-").replace(/(^-|-$)/g, "") || "";
    }

    // Build search items from API data
    const searchItems = searchData.map(service => ({
        name: service.nama_layanan || service.nama || service.title || "",
        category: service.kategori_layanan || service.kategori || service.category || "",
        href: `/layanan/${slugify(service.kategori_layanan || service.kategori || service.category)}/${slugify(service.nama_layanan || service.nama || service.title)}`
    }));

    // Search query filtering
    const filteredSearchItems = searchQuery.trim() === ""
        ? []
        : searchItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <>
            {/* Top Navbar */}
            <nav className={`relative z-50 flex w-full items-center justify-between px-4 md:px-8 py-4 transition-all duration-300 ${
                isScrolled
                    ? "bg-[#CEF2FF]/95 backdrop-blur-md shadow-lg"
                    : "bg-[#CEE2FF]"
                }`}
            >
                <Link href="/">
                    <Image 
                        src="/images/logo/logo.png"
                        alt="SmartHomeCare Logo"
                        width={140}
                        height={50}
                        className="h-9 w-auto md:h-12"
                    />
                </Link>

                {/* Desktop Menu */}
                <ul className="hidden lg:flex items-center gap-8 font-medium text-gray-700">
                    <li>
                        <Link href="/" className={`transition hover:text-green-600 ${pathname === "/" ? "text-green-600 font-semibold" : ""}`}>
                            Beranda
                        </Link>
                    </li>
                    <li>
                        <Link href="/tentang-kami" className={`transition hover:text-green-600 ${pathname === "/tentang-kami" ? "text-green-600 font-semibold" : ""}`}>
                            Tentang Kami
                        </Link>
                    </li>
                    <li>
                        <Link href="/promo" className={`transition hover:text-green-600 ${pathname.startsWith("/promo") ? "text-green-600 font-semibold" : ""}`}>
                            Promo
                        </Link>
                    </li>
                    <li>
                        <Link href="/layanan" className={`transition hover:text-green-600 ${pathname.startsWith("/layanan") ? "text-green-600 font-semibold" : ""}`}>
                            Layanan
                        </Link>
                    </li>
                    <li>
                        <Link href="/artikel" className={`transition hover:text-green-600 ${pathname === "/artikel" ? "text-green-600 font-semibold" : ""}`}>
                            Artikel
                        </Link>
                    </li>
                    
                    {/* HANYA MUNCUL JIKA SUDAH LOGIN (DESKTOP) */}
                    {isLoggedIn && (
                        <li>
                            <Link href="/gabung-mitra" className={`transition hover:text-green-600 ${pathname === "/gabung-mitra" ? "text-green-600 font-semibold" : ""}`}>
                                Gabung Mitra
                            </Link>
                        </li>
                    )}
                </ul>

                {/* Right Area (Desktop) */}
                <div className="hidden lg:flex items-center text-gray-700 gap-5">
                    <button 
                        onClick={() => setIsSearchOpen(true)} 
                        className="cursor-pointer hover:text-green-600 transition p-1"
                        aria-label="Cari Layanan"
                    >
                        <FiSearch size={22} />
                    </button>
                    
                    {isLoggedIn ? (
                        <Link href="/profile" className="text-gray-700 hover:text-green-600 transition">
                            <FiUsers size={22} />
                        </Link>
                    ) : (
                        <Link href="/login">
                            <button className="rounded-lg bg-green-500 px-5 py-2 font-semibold text-white transition hover:bg-green-700">
                                Masuk
                            </button>
                        </Link>
                    )}
                </div>

                {/* Mobile Hamburger Trigger */}
                <div className="flex items-center gap-3 lg:hidden">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="text-gray-700 hover:text-green-600 p-2"
                        aria-label="Cari Layanan"
                    >
                        <FiSearch size={22} />
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-gray-700 hover:text-green-600 p-2 focus:outline-none"
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Dropdown Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-x-0 top-[60px] md:top-[76px] bottom-[64px] z-40 bg-white overflow-y-auto shadow-2xl p-6 lg:hidden flex flex-col justify-between border-t border-slate-100">
                    <div className="space-y-6">
                        <ul className="space-y-4 font-semibold text-lg text-gray-800">
                            <li>
                                <Link 
                                    href="/" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-2 transition-all ${pathname === "/" ? "text-green-600" : "text-gray-800"}`}
                                >
                                    <FiHome size={20} />
                                    <span>Beranda</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/tentang-kami" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-2 transition-all ${pathname === "/tentang-kami" ? "text-green-600" : "text-gray-800"}`}
                                >
                                    <FiInfo size={20} />
                                    <span>Tentang Kami</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/promo" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-2 transition-all ${pathname.startsWith("/promo") ? "text-green-600" : "text-gray-800"}`}
                                >
                                    <FiPercent size={20} />
                                    <span>Promo</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/layanan" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-2 transition-all ${pathname.startsWith("/layanan") ? "text-green-600" : "text-gray-800"}`}
                                >
                                    <FiActivity size={20} />
                                    <span>Layanan</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/artikel" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-2 transition-all ${pathname === "/artikel" ? "text-green-600" : "text-gray-800"}`}
                                >
                                    <FiBook size={20} />
                                    <span>Artikel</span>
                                </Link>
                            </li>

                            {/* HANYA MUNCUL JIKA SUDAH LOGIN (MOBILE DRAWER) */}
                            {isLoggedIn && (
                                <li>
                                    <Link 
                                        href="/gabung-mitra" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 py-2 transition-all ${pathname === "/gabung-mitra" ? "text-green-600" : "text-gray-800"}`}
                                    >
                                        <FiUsers size={20} />
                                        <span>Gabung Mitra</span>
                                    </Link>
                                </li>
                            )}

                            {isLoggedIn && (
                                <li>
                                    <Link 
                                        href="/profile" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 py-2 transition-all ${pathname === "/profile" ? "text-green-600" : "text-gray-800"}`}
                                    >
                                        <FiUserCheck size={20} />
                                        <span>Profil Saya</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    {!isLoggedIn && (
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white transition hover:bg-green-600">
                                    <FiLogIn size={18} />
                                    <span>Masuk Akun</span>
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* FIXED Bottom Navigation Bar (Mobile / Tablet) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2.5 px-4 lg:hidden flex justify-around items-center text-gray-500 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
                <Link 
                    href="/" 
                    className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-colors ${pathname === "/" ? "text-green-600 font-bold" : "hover:text-green-600"}`}
                >
                    <FiHome className={`w-5 h-5 sm:w-6 sm:h-6 ${pathname === "/" ? "stroke-[2.5]" : "stroke-2"}`} />
                    <span>Beranda</span>
                </Link>

                <Link 
                    href="/layanan" 
                    className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-colors ${pathname.startsWith("/layanan") ? "text-green-600 font-bold" : "hover:text-green-600"}`}
                >
                    <FiGrid className={`w-5 h-5 sm:w-6 sm:h-6 ${pathname.startsWith("/layanan") ? "stroke-[2.5]" : "stroke-2"}`} />
                    <span>Layanan</span>
                </Link>

                <Link
                    href={isLoggedIn ? "/profile" : "/login"}
                    className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs transition-colors ${
                        (pathname === "/profile" || pathname === "/login")
                        ? "text-green-600 font-semibold"
                        : "hover:text-green-600"
                    }`}
                    >
                    <FiUsers
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        (pathname === "/profile" || pathname === "/login")
                            ? "stroke-[2.5]"
                            : "stroke-2"
                        }`}
                    />
                    <span>{isLoggedIn ? "Profil" : "Masuk"}</span>
                </Link>
            </nav>

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative overflow-hidden border border-slate-100">
                        <button 
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-base"
                            />
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>

<div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                            {searchLoading ? (
                                <div className="text-center py-8 text-gray-400">
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
                                                className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-green-500 hover:bg-[#EAF8E7] transition text-sm text-gray-700 font-medium"
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
                                            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0">
                                                    SHC
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-sky-600 font-medium group-hover:underline">Lihat Layanan →</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="font-medium text-sm">Layanan {searchQuery} tidak ditemukan.</p>
                                    <p className="text-xs mt-1">Coba gunakan kata kunci lain.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}