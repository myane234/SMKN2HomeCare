import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import logo from '../assets/logo.png';
import { canAccessPath, isSuperAdmin } from '../utils/role';
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
  FaBuilding
} from 'react-icons/fa';

const rawMenuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
  { to: '/layanan', label: 'Layanan', icon: <FaStethoscope /> },
  { to: '/promo', label: 'Promo', icon: <FaGift /> },
  { to: '/artikel', label: 'Artikel', icon: <FaRegFileAlt /> },
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
          {
            to: "/master-provinsi",
            label: "Provinsi",
            icon: <FaMapMarkerAlt />,
          },
          {
            to: "/master-kabupaten",
            label: "Kota / Kabupaten",
            icon: <FaCity />,
          },
          {
            to: "/master-kelurahan",
            label: "Kelurahan",
            icon: <FaCity />,
          // Menu Kecamatan ditambahkan di sini agar masuk ke sub-wilayah
          },
          {
            to: "/master-kecamatan",
            label: "Kecamatan",
            icon: <FaBuilding />, // Atau icon lain yang diinginkan
          },
        ],
      },
      { to: '/master-barang', label: 'Stock Barang', icon: <FaChartBar /> },
      { to: '/master-tarif', label: 'Tarif', icon: <FaChartBar /> },
      { to: '/master-komponen-tarif', label: 'Komponen Tarif', icon: <FaChartBar /> },
      { to: '/master-tarif-transport', label: 'Tarif Transport', icon: <FaChartBar /> },  
      { to: '/master-kategori', label: 'Kategori', icon: <FaTags /> },
      {
        type: "subgroup",
        label: "Pembayaran",
        icon: <FaWallet />,
        children: [
          {
            to: "/master-kategori-pembayaran",
            label: "Kategori Pembayaran",
            icon: <FaTags />,
          },
          {
            to: "/master-metode-pembayaran",
            label: "Metode Pembayaran",
            icon: <FaCreditCard />,
          },
        ],
      },
      { to: "/nakes", label: "Nakes", icon: <FaUserMd />, end: true },
      {
        to: "/nakes/requests",
        label: "Registrasi Nakes",
        icon: <FaUserPlus />,
      },
    ],
  },
  { to: '/booking', label: 'Booking', icon: <FaCalendarCheck /> },
  {
    type: 'group',
    label: 'Config',
    icon: <FaCogs />,
    children: [
      { to: '/kelola-admin', label: 'Kelola Admin', icon: <FaUserShield /> },
      { to: '/tier-admin', label: 'Tier Admin', icon: <FaShieldAlt /> },
    ],
  },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;
const STORAGE_KEY = "sidebar_width";

export default function Sidebar({ open, onClose, collapsed }) {
  // Filter menu items based on tier permissions
  const filterMenuItems = (items) => {
    return items
      .map((item) => {
        if (item.type === 'group') {
          const filteredChildren = filterMenuItems(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        if (item.type === 'subgroup') {
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

  const userIsSuper = isSuperAdmin();
  const menus = filterMenuItems(userIsSuper ? [...rawMenuItems, ...rawSuperAdminMenus] : rawMenuItems);

  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Accordion states
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [wilayahOpen, setWilayahOpen] = useState(true);
  const [pembayaranOpen, setPembayaranOpen] = useState(true);

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
          width: collapsed ? "80px" : `${width}px`,
          transition: isResizing
            ? "none"
            : "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className={
            "flex h-full w-full flex-shrink-0 flex-col overflow-hidden " +
            "bg-gradient-to-b from-white via-slate-50 to-slate-100 " +
            "border-r border-slate-200/80 shadow-[2px_0_16px_0_rgba(30,41,59,0.06)]"
          }
        >
          {/* Logo header */}
          <div
            className="flex h-16 shrink-0 items-center border-b border-slate-200/80 bg-white/70"
            style={{
              padding: collapsed ? "0 0 0 0" : "0 16px",
              justifyContent: collapsed ? "center" : "flex-start",
              transition: "padding 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {collapsed ? (
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
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto overflow-x-hidden">
            {menus.map((item) => {
              if (item.type === 'group') {
                const isConfigGroup = item.label === 'Config';
                const isGroupOpen = isConfigGroup ? configOpen : masterDataOpen;
                const toggleGroupOpen = isConfigGroup
                  ? () => setConfigOpen((prev) => !prev)
                  : () => setMasterDataOpen((prev) => !prev);

                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      type="button"
                      onClick={toggleGroupOpen}
                      className="group relative flex items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-primary-light hover:text-primary-dark"
                    >
                      <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[15px]">
                        {item.icon}
                      </span>

                      <span
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                        style={{
                          maxWidth: collapsed ? "0px" : "220px",
                          opacity: collapsed ? 0 : 1,
                          transition:
                            "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                        }}
                      >
                        {item.label}
                      </span>

                      {!collapsed && (
                        <span className={`ml-auto text-[11px] transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      )}
                    </button>

                    {(isGroupOpen || collapsed) && (
                      <div className={`mt-1 flex flex-col gap-1 ${collapsed ? '' : 'ml-2 border-l border-slate-200/80 pl-2'}`}>
                        {item.children.map((child) => {
                          if (child.type === 'subgroup') {
                            const isWilayah = child.label === 'Wilayah';
                            const isOpen = isWilayah ? wilayahOpen : pembayaranOpen;
                            const toggleOpen = isWilayah
                              ? () => setWilayahOpen((prev) => !prev)
                              : () => setPembayaranOpen((prev) => !prev);

                            return (
                              <div key={child.label} className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={toggleOpen}
                                  className="group relative flex items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-primary-light hover:text-primary-dark"
                                >
                                  <span className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-[13px]">
                                    {child.icon}
                                  </span>

                                  <span
                                    className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                                    style={{
                                      maxWidth: collapsed ? "0px" : "220px",
                                      opacity: collapsed ? 0 : 1,
                                      transition:
                                        "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                                    }}
                                  >
                                    {child.label}
                                  </span>

                                  {!collapsed && (
                                    <span
                                      className={`ml-auto text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    >
                                      ▼
                                    </span>
                                  )}
                                </button>

                                {(isOpen || collapsed) && (
                                  <div
                                    className={`mt-1 flex flex-col gap-1 ${collapsed ? "" : "ml-3 border-l border-slate-200/80 pl-2"}`}
                                  >
                                    {child.children.map((subChild) => (
                                      <NavLink
                                        key={subChild.to}
                                        to={subChild.to}
                                        end={subChild.end}
                                        onClick={onClose}
                                        title={
                                          collapsed ? subChild.label : undefined
                                        }
                                        className={({ isActive }) =>
                                          "group relative flex items-center rounded-xl transition-all duration-150 " +
                                          (collapsed
                                            ? "justify-center px-0 py-2.5"
                                            : "gap-3 px-3 py-2") +
                                          " " +
                                          (isActive
                                            ? "bg-primary text-white shadow-[0_2px_10px_0_rgba(31,157,90,0.22)]"
                                            : "text-slate-500 hover:bg-primary-light hover:text-primary-dark")
                                        }
                                      >
                                        {({ isActive }) => (
                                          <>
                                            <span
                                              className={
                                                "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-[12px] " +
                                                (isActive ? "text-white" : "")
                                              }
                                            >
                                              {subChild.icon}
                                            </span>

                                            <span
                                              className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                              style={{
                                                maxWidth: collapsed
                                                  ? "0px"
                                                  : "220px",
                                                opacity: collapsed ? 0 : 1,
                                                transition:
                                                  "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                                              }}
                                            >
                                              {subChild.label}
                                            </span>

                                            {collapsed && (
                                              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
                                                {subChild.label}
                                              </span>
                                            )}
                                          </>
                                        )}
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
                              title={collapsed ? child.label : undefined}
                              className={({ isActive }) =>
                                "group relative flex items-center rounded-xl transition-all duration-150 " +
                                (collapsed
                                  ? "justify-center px-0 py-2.5"
                                  : "gap-3 px-3 py-2") +
                                " " +
                                (isActive
                                  ? "bg-primary text-white shadow-[0_2px_10px_0_rgba(31,157,90,0.22)]"
                                  : "text-slate-500 hover:bg-primary-light hover:text-primary-dark")
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span
                                    className={
                                      "flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-[13px] " +
                                      (isActive ? "text-white" : "")
                                    }
                                  >
                                    {child.icon}
                                  </span>

                                  <span
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                    style={{
                                      maxWidth: collapsed ? "0px" : "220px",
                                      opacity: collapsed ? 0 : 1,
                                      transition:
                                        "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                                    }}
                                  >
                                    {child.label}
                                  </span>

                                  {collapsed && (
                                    <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
                                      {child.label}
                                    </span>
                                  )}
                                </>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    "group relative flex items-center rounded-xl transition-all duration-150 " +
                    (collapsed
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
                          maxWidth: collapsed ? "0px" : "220px",
                          opacity: collapsed ? 0 : 1,
                          transition:
                            "max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease",
                        }}
                      >
                        {item.label}
                      </span>

                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
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
