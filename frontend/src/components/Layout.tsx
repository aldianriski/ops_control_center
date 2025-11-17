import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import EnvironmentSwitcher from './EnvironmentSwitcher';
import TeamSwitcher from './TeamSwitcher';
import {
  LayoutDashboard,
  Server,
  DollarSign,
  FileText,
  BookOpen,
  LogOut,
  Shield,
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/infra', label: 'InfraOps', icon: Server },
    { to: '/secops', label: 'SecOps', icon: Shield },
    { to: '/finops', label: 'FinOps', icon: DollarSign },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/sops', label: 'SOPs', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Edot Ops Control Center
            </h1>
            <div className="flex items-center gap-4">
              <TeamSwitcher />
              <EnvironmentSwitcher />
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
