import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import EnvironmentSwitcher from './EnvironmentSwitcher';
import TeamSwitcher from './TeamSwitcher';
import WorkModeSelector from './WorkModeSelector';
import AIOpsAssistant from './AIOpsAssistant';
import CommandPalette from './CommandPalette';
import EnvironmentComparison from './EnvironmentComparison';
import NotificationPanel from './NotificationPanel';
import RateLimitIndicator from './RateLimitIndicator';
import useSearchStore from '../store/searchStore';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Server,
  DollarSign,
  FileText,
  BookOpen,
  LogOut,
  Shield,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  Search,
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, addNotification } = useNotificationStore();
  const { setOpen: setSearchOpen } = useSearchStore();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // WebSocket connection
  const { connectionStatus, isConnected, lastMessage } = useWebSocket({
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      // Handle different message types
      if (message.type === 'notification') {
        addNotification({
          title: message.data.title,
          message: message.data.message,
          type: message.data.type || 'info',
          priority: message.data.priority || 'normal',
          actionUrl: message.data.actionUrl,
          metadata: message.data,
        });

        // Also show a toast for immediate feedback
        toast[message.data.type === 'error' ? 'error' : 'info'](message.data.title);
      } else {
        // For other events, create notifications
        const notificationMap: Record<string, any> = {
          incident: {
            title: `${message.action === 'created' ? 'New' : 'Updated'} Incident`,
            message: `Incident ${message.data.jira_id}: ${message.data.title}`,
            type: message.data.severity === 'critical' ? 'error' : 'warning',
            priority: message.data.severity === 'critical' ? 'urgent' : 'high',
            actionUrl: '/infra?tab=incidents',
          },
          task: {
            title: `${message.action === 'created' ? 'New' : 'Updated'} Task`,
            message: `Task ${message.data.jira_id}: ${message.data.title}`,
            type: 'info',
            priority: 'normal',
            actionUrl: '/infra?tab=tasks',
          },
          alert: {
            title: 'System Alert',
            message: `${message.data.metric} exceeded threshold in ${message.data.environment}`,
            type: 'warning',
            priority: message.data.severity === 'high' ? 'high' : 'normal',
          },
        };

        if (notificationMap[message.type]) {
          addNotification(notificationMap[message.type]);
        }
      }
    },
  });

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/infra', label: 'InfraOps', icon: Server },
    { to: '/secops', label: 'SecOps', icon: Shield },
    { to: '/finops', label: 'FinOps', icon: DollarSign },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/sops', label: 'SOPs', icon: BookOpen },
    { to: '/admin', label: 'Admin', icon: Settings },
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
              <WorkModeSelector />
              <div className="h-6 w-px bg-gray-300" />
              <TeamSwitcher />
              <EnvironmentSwitcher />
              <div className="h-6 w-px bg-gray-300" />

              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-2" title={`WebSocket: ${connectionStatus}`}>
                {isConnected ? (
                  <Wifi size={16} className="text-green-600" />
                ) : (
                  <WifiOff size={16} className="text-gray-400" />
                )}
              </div>

              {/* Rate Limit Indicator */}
              <RateLimitIndicator position="header" />

              {/* Global Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
                title="Search (⌘K)"
              >
                <Search size={16} />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-300 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationPanelOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-gray-300" />
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

      {/* AIOps Assistant - Floating Panel */}
      <AIOpsAssistant />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />

      {/* Environment Comparison Panel */}
      <EnvironmentComparison />
    </div>
  );
};

export default Layout;
