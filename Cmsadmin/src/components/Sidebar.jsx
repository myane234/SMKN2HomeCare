import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { canAccessPath } from "../utils/role";
import {
  FaStethoscope,
  FaGift,
  FaRegFileAlt,
  FaChartBar,
  FaUserShield,
  FaShieldAlt,
  FaUserMd,
  FaUserPlus,
  FaCalendarCheck,
  FaUsers,
  FaMapMarkerAlt,
  FaCity,
  FaTags,
  FaCreditCard,
  FaGlobeAmericas,
  FaWallet,
  FaCogs,
  FaBuilding,
  FaDesktop,
  FaHome,
  FaInfoCircle,
  FaHandshake,
  FaGlobe,
  FaBell,
  FaHistory,
  FaFileAlt,
  FaChartLine,
  FaFileExcel,
  FaUserCircle,
  FaPrayingHands,
  FaGraduationCap,
  FaDatabase,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
} from "react-icons/fa";

const rawMenuItems = [
  { to: "/dashboard", label: "Dashboard", icon: <FaChartBar />, end: true },
  {
    type: "group",
    label: "Kelola Konten",
    icon: <FaDesktop />,
    children: [
      { to: "/kelola-konten/home", label: "Beranda", icon: <FaHome /> },
      {
        to: "/kelola-konten/about",
        label: "Tentang Kami",
        icon: <FaInfoCircle />,
      },
      {
        type: "subgroup",
        label: "Promo",
        icon: <FaGift />,
        children: [
          { to: "/promo", label: "Daftar Promo", icon: <FaGift /> },
          { to: "/promo/tambah", label: "Tambah Promo", icon: <FaPlus /> },
        ],
      },
      {
        type: "subgroup",
        label: "Layanan",
        icon: <FaStethoscope />,
        children: [
          { to: "/layanan", label: "Daftar Layanan", icon: <FaStethoscope /> },
          { to: "/layanan/tambah", label: "Tambah Layanan", icon: <FaPlus /> },
        ],
      },
      {
        type: "subgroup",
        label: "Artikel",
        icon: <FaRegFileAlt />,
        children: [
          { to: "/artikel", label: "Daftar Artikel", icon: <FaRegFileAlt /> },
          { to: "/artikel/tambah", label: "Tambah Artikel", icon: <FaPlus /> },
          {
            to: "/statistik-artikel",
            label: "Statistik Artikel",
            icon: <FaChartLine />,
          },
        ],
      },
      {
        type: "subgroup",
        label: "Konten Tambahan",
        icon: <FaHandshake />,
        children: [
          {
            to: "/kelola-konten/mitra",
            label: "Gabung Mitra",
            icon: <FaHandshake />,
          },
          { to: "/kelola-konten/footer", label: "Footer", icon: <FaGlobe /> },
        ],
      },
    ],
  },
];

const rawSuperAdminMenus = [
  {
    type: "group",
    label: "Master Data",
    icon: <FaUserMd />,
    children: [
      { to: "/users", label: "Pasien", icon: <FaUsers /> },
      {
        type: "subgroup",
        label: "Wilayah",
        icon: <FaGlobeAmericas />,
        children: [
          { to: "/master-provinsi", label: "Provinsi", icon: <FaMapMarkerAlt /> },
          { to: "/master-kabupaten", label: "Kota / Kabupaten", icon: <FaCity /> },
          { to: "/master-kecamatan", label: "Kecamatan", icon: <FaBuilding /> },
          { to: "/master-kelurahan", label: "Kelurahan", icon: <FaCity /> },
        ],
      },
      {
        type: "subgroup",
        label: "Tarif",
        icon: <FaChartBar />,
        children: [
          { to: "/master-tarif", label: "Tarif", icon: <FaChartBar /> },
          { to: "/master-komponen-tarif", label: "Komponen Tarif", icon: <FaChartBar /> },
          { to: "/master-tarif-transport", label: "Tarif Transport", icon: <FaChartBar /> },
        ],
      },
      { to: "/master-barang", label: "Stock Barang", icon: <FaChartBar /> },
      { to: "/master-pendidikan", label: "Pendidikan", icon: <FaChartBar /> },
      { to: "/master-universitas", label: "Universitas", icon: <FaGraduationCap /> },
      { to: "/master-agama", label: "Agama", icon: <FaPrayingHands /> },
      { to: "/master-kategori", label: "Kategori", icon: <FaTags /> },
      { to: "/master-bank", label: "Bank", icon: <FaCreditCard /> },
      {
        type: "subgroup",
        label: "Pembayaran",
        icon: <FaWallet />,
        children: [
          { to: "/master-kategori-pembayaran", label: "Kategori Pembayaran", icon: <FaTags /> },
          { to: "/master-metode-pembayaran", label: "Metode Pembayaran", icon: <FaCreditCard /> },
        ],
      },
      { to: "/nakes", label: "Nakes", icon: <FaUserMd />, end: true },
      { to: "/nakes/requests", label: "Registrasi Nakes", icon: <FaUserPlus /> },
    ],
  },
  { to: "/booking", label: "Booking", icon: <FaCalendarCheck /> },
  {
    type: "group",
    label: "Konfigurasi",
    icon: <FaCogs />,
    children: [
      { to: "/kelola-admin", label: "Kelola Admin", icon: <FaUserShield /> },
      { to: "/tier-admin", label: "Tier Admin", icon: <FaShieldAlt /> },
      { to: "/notification-templates", label: "Template Notifikasi", icon: <FaBell /> },
      { to: "/web-setting", label: "Web Setting (Logo & Icon)", icon: <FaCogs /> },
      { to: "/konfigurasi-env", label: "API", icon: <FaCogs /> },
      {
        type: "subgroup",
        label: "Pengaturan",
        icon: <FaCogs />,
        children: [{ to: "/seeders", label: "Seeder Database", icon: <FaDatabase /> }],
      },
      { to: "/profile-admin", label: "Profil Admin", icon: <FaUserCircle /> },
    ],
  },
  {
    type: "group",
    label: "Legalitas & Dokumen",
    icon: <FaFileAlt />,
    children: [
      { to: "/syarat-ketentuan-pasien", label: "Syarat & Ketentuan Pasien", icon: <FaFileAlt /> },
      { to: "/syarat-ketentuan-nakes", label: "Syarat & Ketentuan Nakes", icon: <FaUserMd /> },
    ],
  },
  {
    type: "group",
    label: "Statistik, Laporan & Log",
    icon: <FaChartLine />,
    children: [
      { to: "/statistik-artikel", label: "Statistik View Artikel", icon: <FaChartLine /> },
      { to: "/laporan", label: "Laporan & Export Data", icon: <FaFileExcel /> },
      { to: "/aktivitas-log", label: "Log Aktivitas", icon: <FaHistory /> },
    ],
  },
];


const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;
const STORAGE_KEY = "sidebar_width";

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  // Local state untuk collapse jika tidak di-pass dari props
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed(!localCollapsed);
    }
  };

  // Filter menu items berdasarkan role
  const filterMenuItems = (items) => {
    return items
      .map((item) => {
        if (item.type === "group" || item.type === "subgroup") {
          const filteredChildren = filterMenuItems(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        if (canAccessPath(item.to)) {
          return item;
        }
        return null;
      })
      .filter(Boolean);
  };

  const menus = filterMenuItems([...rawMenuItems, ...rawSuperAdminMenus]);

  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Accordion states
  const [openGroups, setOpenGroups] = useState({
    "Kelola Konten": true,
    "Master Data": true,
    Konfigurasi: true,
  });
  const [openSubgroups, setOpenSubgroups] = useState({
    Promo: true,
    Layanan: true,
    Artikel: true,
    Wilayah: true,
    Pembayaran: true,
    "Konten Tambahan": false,
    Pengaturan: false,
  });

  const asideRef = useRef(null);

  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e) {
      const asideLeft = asideRef.current?.getBoundingClientRect().left || 0;
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, e.clientX - asideLeft),
      );
      setWidth(nextWidth);
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(width));
  }, [width, isResizing]);

  // Render Submenu Item Rekursif untuk Popup Flyout saat Sidebar Minimized
  const renderFlyoutChildren = (children) => {
    return children.map((child) => {
      if (child.type === "subgroup") {
        return (
          <div key={child.label} className="mt-2 first:mt-0">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="text-primary">{child.icon}</span>
              <span>{child.label}</span>
            </div>
            <div className="mt-1 flex flex-col gap-1 pl-2 border-l border-slate-200">
              {renderFlyoutChildren(child.children)}
            </div>
          </div>
        );
      }

      return (
        <NavLink
          key={child.to}
          to={child.to}
          end={child.end}
          onClick={onClose}
          className={({ isActive }) =>
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all " +
            (isActive
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:bg-primary-light hover:text-primary-dark")
          }
        >
          <span className="text-sm shrink-0">{child.icon}</span>
          <span className="truncate">{child.label}</span>
        </NavLink>
      );
    });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={asideRef}
        className={
          "fixed inset-y-0 left-0 z-40 flex flex-shrink-0 flex-col " +
          "transition-transform duration-200 md:relative md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
        style={{
          width: isCollapsed ? "80px" : `${width}px`,
          transition: isResizing
            ? "none"
            : "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className={
            "flex h-full w-full flex-shrink-0 flex-col " +
            "bg-gradient-to-b from-white via-slate-50 to-slate-100 " +
            "border-r border-slate-200/80 shadow-[2px_0_16px_0_rgba(30,41,59,0.06)]"
          }
        >
          {/* Logo Header & Minimize Toggle Button */}
          <div
            className="flex h-16 shrink-0 items-center border-b border-slate-200/80 bg-white/70 px-4 justify-between relative"
            style={{
              padding: isCollapsed ? "0 16px" : "0 16px",
              justifyContent: isCollapsed ? "center" : "space-between",
              transition: "padding 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {isCollapsed ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <FaChartBar className="text-primary text-base" />
              </div>
            ) : (
              <img
                src={logo}
                alt="Smartcare"
                className="h-9 w-auto object-contain"
              />
            )}

            {/* Tombol Arrow Minimaze / Expand */}
            <button
              type="button"
              onClick={handleToggle}
              title={isCollapsed ? "Perluas Sidebar" : "Kecilkan Sidebar"}
              className={`hidden h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition-all hover:bg-primary-light hover:text-primary-dark md:flex ${
                isCollapsed
                  ? "absolute right-[-12px] top-1/2 z-50 -translate-y-1/2"
                  : ""
              }`}
            >
              {isCollapsed ? (
                <FaChevronRight className="text-xs" />
              ) : (
                <FaChevronLeft className="text-xs" />
              )}
            </button>
          </div>

          {/* Navigation items - overflow-visible jika collapsed agar flyout tidak terpotong */}
          <nav
            className={`flex flex-col gap-1 p-2 flex-1 ${
              isCollapsed
                ? "overflow-visible"
                : "overflow-y-auto overflow-x-hidden"
            }`}
          >
            {menus.map((item) => {
              if (item.type === "group") {
                const isGroupOpen = openGroups[item.label] ?? true;
                const toggleGroupOpen = () => {
                  setOpenGroups((prev) => ({
                    ...prev,
                    [item.label]: !prev[item.label],
                  }));
                };

                return (
                  <div
                    key={item.label}
                    className="relative group/flyout flex flex-col"
                  >
                    {/** Keep the group name available to screen readers and the minimized flyout. */}
                    <span className="sr-only">Menu {item.label}</span>
                    {/* Tombol Grup */}
                    <button
                      type="button"
                      onClick={toggleGroupOpen}
                      aria-expanded={isGroupOpen}
                      aria-controls={`sidebar-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="group relative flex w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-primary-light hover:text-primary-dark"
                    >
                      <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[15px]">
                        {item.icon}
                      </span>

                      <span
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                        style={{
                          maxWidth: isCollapsed ? "0px" : "220px",
                          opacity: isCollapsed ? 0 : 1,
                          transition:
                            "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                        }}
                      >
                        {item.label}
                      </span>

                      {!isCollapsed && (
                        <span
                          className={`ml-auto text-[11px] transition-transform duration-200 ${
                            isGroupOpen ? "rotate-180" : ""
                          }`}
                        >
                          <FaChevronDown />
                        </span>
                      )}
                    </button>

                    {/* MODE EXPANDED: Accordion Anak Menu */}
                    {!isCollapsed && isGroupOpen && (
                      <div
                        id={`sidebar-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="mt-1 ml-2 flex flex-col gap-1 border-l border-slate-200/80 pl-2"
                      >
                        {item.children.map((child) => {
                          if (child.type === "subgroup") {
                            const isOpen = openSubgroups[child.label] ?? false;
                            const toggleOpen = () =>
                              setOpenSubgroups((prev) => ({
                                ...prev,
                                [child.label]: !isOpen,
                              }));

                            return (
                              <div key={child.label} className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={toggleOpen}
                                  aria-expanded={isOpen}
                                  aria-controls={`sidebar-subgroup-${child.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                  className="group relative flex items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-primary-light hover:text-primary-dark"
                                >
                                  <span className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-[13px]">
                                    {child.icon}
                                  </span>

                                  <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                                    {child.label}
                                  </span>

                                  <span
                                    className={`ml-auto text-[10px] transition-transform duration-200 ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  >
                                    <FaChevronDown />
                                  </span>
                                </button>

                                {isOpen && (
                                  <div
                                    id={`sidebar-subgroup-${child.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                    className="mt-1 ml-3 flex flex-col gap-1 border-l border-slate-200/80 pl-2"
                                  >
                                    {child.children.map((subChild) => (
                                      <NavLink
                                        key={subChild.to}
                                        to={subChild.to}
                                        end={subChild.end}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 " +
                                          (isActive
                                            ? "bg-primary text-white shadow-[0_2px_10px_0_rgba(31,157,90,0.22)]"
                                            : "text-slate-500 hover:bg-primary-light hover:text-primary-dark")
                                        }
                                      >
                                        <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-[12px]">
                                          {subChild.icon}
                                        </span>
                                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                          {subChild.label}
                                        </span>
                                      </NavLink>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              end={child.end}
                              onClick={onClose}
                              className={({ isActive }) =>
                                "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 " +
                                (isActive
                                  ? "bg-primary text-white shadow-[0_2px_10px_0_rgba(31,157,90,0.22)]"
                                  : "text-slate-500 hover:bg-primary-light hover:text-primary-dark")
                              }
                            >
                              <span className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-[13px]">
                                {child.icon}
                              </span>
                              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                {child.label}
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}

                    {/* MODE MINIMIZED: Popup Flyout Card saat Hover */}
                    {isCollapsed && (
                      <div className="invisible pointer-events-none absolute left-full top-0 z-50 ml-3 w-64 rounded-2xl border border-slate-200/90 bg-white p-3 opacity-0 shadow-2xl transition-all duration-200 ease-out group-hover/flyout:pointer-events-auto group-hover/flyout:visible group-hover/flyout:opacity-100 group-focus-within/flyout:pointer-events-auto group-focus-within/flyout:visible group-focus-within/flyout:opacity-100">
                        <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 mb-2 font-bold text-slate-800 text-sm">
                          <span className="text-primary text-base">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                          {renderFlyoutChildren(item.children)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Menu Tunggal (Tanpa Anak)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    "group relative flex items-center rounded-xl transition-all duration-150 " +
                    (isCollapsed
                      ? "justify-center px-0 py-3"
                      : "gap-3 px-3.5 py-2.5") +
                    " " +
                    (isActive
                      ? "bg-primary text-white shadow-[0_2px_12px_0_rgba(31,157,90,0.28)]"
                      : "text-slate-500 hover:bg-primary-light hover:text-primary-dark")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          "flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[15px] " +
                          (isActive ? "text-white" : "")
                        }
                      >
                        {item.icon}
                      </span>

                      <span
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        style={{
                          maxWidth: isCollapsed ? "0px" : "220px",
                          opacity: isCollapsed ? 0 : 1,
                          transition:
                            "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                        }}
                      >
                        {item.label}
                      </span>

                      {/* Tooltip Popup Sederhana saat Minimized untuk Menu Tunggal */}
                      {isCollapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xl group-hover:flex items-center gap-2 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
