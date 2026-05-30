// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Tag, Users,
  Image, Bell, ClipboardList, Settings, X, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import logo from '../assets/logo.png';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/articles', label: 'Articles', icon: Newspaper },
      { to: '/categories', label: 'Categories', icon: Tag },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/media', label: 'Media Library', icon: Image },
      { to: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { admin } = useAuthStore();

  const linkClass = (isActive: boolean) =>
    `group flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-red text-white'
        : 'text-gray-400 hover:text-white hover:bg-ink-700'
    }`;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-ink-950 flex flex-col z-30
        border-r border-ink-700
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-ink-700">
          <img src={logo} alt="Agnisiragu" className="h-9 w-auto" />
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-2xs font-semibold uppercase tracking-widest text-ink-500 px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    onClick={onClose}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {admin?.adminRole === 'SUPER_ADMIN' && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-ink-500 px-3 mb-2">
                Admin
              </p>
              <NavLink
                to="/settings" onClick={onClose}
                className={({ isActive }) => linkClass(isActive)}
              >
                <Settings size={16} className="flex-shrink-0" />
                <span className="flex-1">Settings</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Admin badge */}
        <div className="px-4 py-4 border-t border-ink-700">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-red flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {admin?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{admin?.name}</p>
              <p className="text-2xs text-ink-500 truncate">{admin?.adminRole?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
