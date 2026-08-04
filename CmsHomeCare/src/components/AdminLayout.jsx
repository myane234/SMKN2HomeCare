import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminSidebar from '../pages/admin/AdminSidebar';
import { getSession, logout } from '../utils/auth';
import { isSuperAdmin } from '../utils/role';

const SIDEBAR_STORAGE_KEY = 'sidebar-width';
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 280;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  const [open, setOpen] = useState(false); // User dropdown
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer
  const [collapsed, setCollapsed] = useState(false); // Desktop collapse state

  // State untuk Resize Sidebar (sebelumnya terlewat)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  const menuRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(sidebarWidth);
  const useAdminSidebar = location.pathname.startsWith('/admin');

  // Restore collapsed preference dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cms_sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  // Handle click outside untuk menutup dropdown profil
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem('cms_sidebar_collapsed', String(!c));
      return !c;
    });
  }

  // Handle Drag-to-Resize Sidebar
  useEffect(() => {
    if (!isResizing) return undefined;

    function handleMouseMove(event) {
      const delta = event.clientX - startXRef.current;
      const nextWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidthRef.current + delta)
      );
      setSidebarWidth(nextWidth);
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Simpan sidebarWidth ke localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  function handleResizeMouseDown(event) {
    startXRef.current = event.clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const sidebarProps = {
    open: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    collapsed,
    onCollapse: toggleCollapse,
    width: sidebarWidth, // Mengirim properti width ke komponen Sidebar jika dibutuhkan
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Kiri */}
      {useAdminSidebar ? (
        <AdminSidebar {...sidebarProps} />
      ) : (
        <Sidebar {...sidebarProps} />
      )}

      {/* Resize Handle (Garis batas pemisah yang bisa digeser) */}
      <div
        className="hidden md:block cursor-col-resize bg-slate-100 hover:bg-slate-200 transition-colors"
        style={{ width: '6px' }}
        onMouseDown={handleResizeMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      />

      {/* Area Kanan (Header + Konten Utama) */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 transition-colors"
              onClick={() => setOpen((o) => !o)}
            >
              <span className="hidden text-[13px] font-semibold text-slate-700 sm:inline">
                Hi, {session?.name?.split(' ')[0] || 'Admin'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-green-100 border border-primary/20 text-base font-bold text-primary-dark">
                {(session?.name?.[0] || 'A').toUpperCase()}
              </div>
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 z-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-green-100 border border-primary/20 text-lg font-bold text-primary-dark">
                    {(session?.name?.[0] || 'A').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {session?.name || 'Admin'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="truncate text-xs text-slate-500">{session?.email}</span>
                      {isSuperAdmin() && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="my-3.5 h-px bg-slate-100" />
                <button
                  className="flex w-full items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={handleLogout}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}