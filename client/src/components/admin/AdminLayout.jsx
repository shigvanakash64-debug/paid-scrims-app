import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from '../../screens/AdminDashboard';
import { LiveMatches } from '../../screens/LiveMatches';
import { PaymentsPanel } from '../../screens/PaymentsPanel';
import { DisputesPanel } from '../../screens/DisputesPanel';
import { UsersPanel } from '../../screens/UsersPanel';
import { WithdrawalsPanel } from '../../screens/WithdrawalsPanel';
import { LogsPanel } from '../../screens/LogsPanel';

const SCREENS = {
  DASHBOARD: 'dashboard',
  LIVE_MATCHES: 'live_matches',
  PAYMENTS: 'payments',
  DISPUTES: 'disputes',
  USERS: 'users',
  WITHDRAWALS: 'withdrawals',
  LOGS: 'logs',
};

export const AdminLayout = () => {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.DASHBOARD:
        return <AdminDashboard />;
      case SCREENS.LIVE_MATCHES:
        return <LiveMatches />;
      case SCREENS.PAYMENTS:
        return <PaymentsPanel />;
      case SCREENS.DISPUTES:
        return <DisputesPanel />;
      case SCREENS.USERS:
        return <UsersPanel />;
      case SCREENS.WITHDRAWALS:
        return <WithdrawalsPanel />;
      case SCREENS.LOGS:
        return <LogsPanel />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 border-r border-[#1F1F1F]">
        <AdminSidebar
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          currentScreen={currentScreen}
          onScreenChange={(screen) => {
            setCurrentScreen(screen);
            setSidebarOpen(false);
          }}
          isMobile={true}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-[#1F1F1F] bg-[#111111]">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#FF6A00]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};
