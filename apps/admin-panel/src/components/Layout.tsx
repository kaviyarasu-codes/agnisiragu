// src/components/Layout.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/auth.store';
import { clearToken } from '../lib/auth';

const BREADCRUMBS: Record<string, string[]> = {
  '/':              ['Dashboard'],
  '/articles':      ['Content', 'Articles'],
  '/articles/new':  ['Content', 'Articles', 'New Article'],
  '/categories':    ['Content', 'Categories'],
  '/users':         ['Manage', 'Users'],
  '/media':         ['Manage', 'Media Library'],
  '/notifications': ['Manage', 'Notifications'],
  '/reports':       ['Analytics', 'Reports'],
  '/audit-logs':    ['Analytics', 'Audit Logs'],
  '/accounts':      ['Admin', 'Admin Accounts'],
  '/app-config':    ['Admin', 'App Config'],
  '/settings':      ['Admin', 'Settings'],
};

function getBreadcrumb(pathname: string): string[] {
  if (pathname.includes('/edit')) return ['Content', 'Articles', 'Edit Article'];
  return BREADCRUMBS[pathname] || ['Admin Panel'];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    clearToken();
    navigate('/login');
  };

  const crumbs = getBreadcrumb(location.pathname);
  const pageTitle = crumbs[crumbs.length - 1];

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between px-5 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-page rounded transition-colors"
              >
                <Menu size={18} />
              </button>
              <nav className="flex items-center gap-1.5 text-sm">
                {crumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i < crumbs.length - 1 ? (
                      <>
                        <span className="text-text-muted">{crumb}</span>
                        <ChevronRight size={12} className="text-text-muted" />
                      </>
                    ) : (
                      <span className="font-semibold text-text-primary">{crumb}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded border border-border bg-page">
                <div className="w-6 h-6 rounded-full bg-red flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold leading-none">
                    {admin?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-text-primary leading-none">{admin?.name}</p>
                  <p className="text-2xs text-text-muted mt-0.5">{admin?.adminRole?.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-red hover:bg-red/5 rounded border border-transparent hover:border-red/20 transition-all duration-150"
              >
                <LogOut size={14} />
                <span className="hidden sm:block font-medium">Logout</span>
              </button>
            </div>
          </div>

          <div className="px-5 pb-3 pt-0">
            <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
          </div>
        </header>

        {/* Content — full width, no max-w constraint */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
