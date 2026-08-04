import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import logo from '../../assets/logo.png';
import { FaChartBar, FaUserMd, FaUserPlus, FaCalendarCheck, FaAngleLeft, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';

const menuItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaChartBar /> },
  {
    type: 'group',
    label: 'Master Data',
    icon: <FaUserMd />,
    children: [
      { to: '/admin/users', label: 'Pasien', icon: <FaUsers /> },
      { to: '/admin/master-provinsi', label: 'Provinsi', icon: <FaMapMarkerAlt /> },
      { to: '/admin/master-barang', label: 'Stock Barang', icon: <FaChartBar /> },
      { to: '/admin/master-tarif', label: 'Tarif', icon: <FaChartBar /> },
      { to: '/admin/nakes', label: 'Nakes', icon: <FaUserMd />, end: true },
      { to: '/admin/nakes/requests', label: 'Registrasi Nakes', icon: <FaUserPlus /> },
    ],
  },
  { to: '/admin/booking', label: 'Booking', icon: <FaCalendarCheck /> },
];

const COLLAPSED_WIDTH = 68;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;
const STORAGE_KEY = 'admin_sidebar_width';

export default function AdminSidebar({ open, onClose, collapsed, onCollapse }) {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const asideRef = useRef(null);

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  const handleResizeStart = useCallback((e) => {
    if (collapsed) return;
    e.preventDefault();
    setIsResizing(true);
  }, [collapsed]);

  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e) {
      const asideLeft = asideRef.current?.getBoundingClientRect().left || 0;
      const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - asideLeft));
      setWidth(nextWidth);
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) return;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, String(width));
  }, [width, isResizing]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      {/* 🟢 FIX 1: Menggabungkan style ke dalam 1 objek tunggal */}
      <aside
        ref={asideRef}
        style={{
          width: `${currentWidth}px`,
          transition: isResizing ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
        className={
          'fixed inset-y-0 left-0 z-40 flex flex-shrink-0 flex-col ' +
          'transition-transform duration-200 md:relative md:translate-x-0 ' +
          (open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
      >
        {/* Inner panel */}
        <div
          className={
            'flex h-full w-full flex-shrink-0 flex-col overflow-hidden ' +
            'bg-gradient-to-b from-white via-slate-50 to-slate-100 ' +
            'border-r border-slate-200/80 shadow-[2px_0_16px_0_rgba(30,41,59,0.06)]'
          }
        >
          {/* Logo header */}
          <div
            className="flex items-center border-b border-slate-200/80 bg-white/70"
            style={{
              minHeight: '64px',
              padding: collapsed ? '0 0 0 0' : '0 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'padding 220ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {collapsed ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <FaChartBar className="text-primary text-base" />
              </div>
            ) : (
              <img src={logo} alt="Smartcare" className="h-9 w-auto object-contain" />
            )}
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto overflow-x-hidden">
            {menuItems.map((item) => {
              if (item.type === 'group') {
                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setMasterDataOpen((prev) => !prev)}
                      className="group relative flex items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-primary-light hover:text-primary-dark"
                    >
                      <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[15px]">
                        {item.icon}
                      </span>

                      <span
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                        style={{
                          maxWidth: collapsed ? '0px' : '220px',
                          opacity: collapsed ? 0 : 1,
                          transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
                        }}
                      >
                        {item.label}
                      </span>

                      {!collapsed && (
                        <span className={`ml-auto text-[11px] transition-transform ${masterDataOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      )}
                    </button>

                    {(masterDataOpen || collapsed) && (
                      <div className={`mt-1 flex flex-col gap-1 ${collapsed ? '' : 'ml-2 border-l border-slate-200/80 pl-2'}`}>
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.end}
                            onClick={onClose}
                            title={collapsed ? child.label : undefined}
                            className={({ isActive }) =>
                              'group relative flex items-center rounded-xl transition-all duration-150 ' +
                              (collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2') + ' ' +
                              (isActive
                                ? 'bg-primary text-white shadow-[0_2px_10px_0_rgba(31,157,90,0.22)]'
                                : 'text-slate-500 hover:bg-primary-light hover:text-primary-dark')
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span
                                  className={
                                    'flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-[13px] ' +
                                    (isActive ? 'text-white' : '')
                                  }
                                >
                                  {child.icon}
                                </span>

                                <span
                                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                  style={{
                                    maxWidth: collapsed ? '0px' : '220px',
                                    opacity: collapsed ? 0 : 1,
                                    transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
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
                        ))}
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
                    'group relative flex items-center rounded-xl transition-all duration-150 ' +
                    (collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-2.5') + ' ' +
                    (isActive
                      ? 'bg-primary text-white shadow-[0_2px_12px_0_rgba(31,157,90,0.28)]'
                      : 'text-slate-500 hover:bg-primary-light hover:text-primary-dark')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[15px] ' +
                          (isActive ? 'text-white' : '')
                        }
                      >
                        {item.icon}
                      </span>

                      <span
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        style={{
                          maxWidth: collapsed ? '0px' : '220px',
                          opacity: collapsed ? 0 : 1,
                          transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
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

        {/* Drag-to-resize handle */}
        {!collapsed && (
          <div
            onMouseDown={handleResizeStart}
            className={
              'hidden md:block absolute right-0 top-0 h-full w-1.5 cursor-col-resize ' +
              'group/resize z-40'
            }
            title="Geser untuk mengubah lebar sidebar"
          >
            <div
              className={
                'h-full w-full transition-colors duration-150 ' +
                (isResizing
                  ? 'bg-primary'
                  : 'bg-transparent group-hover/resize:bg-primary/40')
              }
            />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onCollapse}
          className="group/toggle hidden md:flex absolute top-6 right-0 translate-x-1/2 z-50 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-150 hover:border-primary hover:text-primary hover:shadow-md"
        >
          <FaAngleLeft
            className="text-[11px] transition-transform duration-200"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />

          {/* Tooltip */}
          <span className="pointer-events-none absolute left-1/2 top-full mt-2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover/toggle:flex">
            {collapsed ? 'Perlebar' : 'Sembunyikan'}
          </span>
        </button>
      </aside>
    </>
  );
}