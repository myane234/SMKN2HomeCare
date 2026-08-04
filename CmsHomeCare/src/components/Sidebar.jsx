import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import logo from '../assets/logo.png';
import { FaStethoscope, FaGift, FaRegFileAlt, FaChartBar, FaUserShield, FaAngleLeft } from 'react-icons/fa';
import { isSuperAdmin } from '../utils/role';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar /> },
  { to: '/layanan', label: 'Layanan', icon: <FaStethoscope /> },
  { to: '/promo', label: 'Promo', icon: <FaGift /> },
  { to: '/artikel', label: 'Artikel', icon: <FaRegFileAlt /> },
];

const superAdminMenus = [
  { to: '/kelola-admin', label: 'Kelola Admin', icon: <FaUserShield /> },
];

const COLLAPSED_WIDTH = 68;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 240;
const STORAGE_KEY = 'sidebar_width';

export default function Sidebar({ open, onClose, collapsed, onCollapse }) {
  const menus = isSuperAdmin() ? [...menuItems, ...superAdminMenus] : menuItems;

  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
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
    if (isResizing) return; // persist only once drag finishes
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
        style={{ width: collapsed ? '80px' : `${width}px` }}
      >
        {/* Inner panel — carries the background/border/shadow and clips its own content only */}
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
          {menus.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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

                  {/* Label — hides when collapsed */}
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

                  {/* Tooltip on collapsed */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Login Super Admin */}
        <div
          className="border-t border-slate-200/80 p-2"
          style={{
            overflow: 'hidden',
          }}
        >
          {collapsed ? (
            <a
              href="/super-admin/login"
              title="Login Super Admin"
              className="group relative flex items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-primary-light hover:text-primary-dark transition-colors"
            >
              <FaUserShield className="text-base flex-shrink-0" />
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
                Login Super Admin
              </span>
            </a>
          ) : (
            <a
              href="/super-admin/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary-dark hover:bg-primary hover:text-white transition-all duration-150"
            >
              <FaUserShield className="flex-shrink-0" />
              <span
                className="whitespace-nowrap overflow-hidden"
                style={{
                  maxWidth: collapsed ? '0px' : '220px',
                  opacity: collapsed ? 0 : 1,
                  transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
                }}
              >
                Login Super Admin
              </span>
            </a>
          )}
        </div>
        </div>
        {/* ^ closes inner overflow-hidden panel — resize handle & toggle button below float outside it */}

        {/* Drag-to-resize handle — desktop only, disabled while collapsed */}
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

        {/* Collapse toggle — floats on the outer edge of the sidebar, icon-only, tooltip on hover */}
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