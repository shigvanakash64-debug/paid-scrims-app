import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from '../../screens/AdminDashboard';
import { UsersPanel } from '../../screens/UsersPanel';
import { WithdrawalsPanel } from '../../screens/WithdrawalsPanel';
import { DisputesPanel } from '../../screens/DisputesPanel';
import { AdminLeaderboardPanel } from '../../screens/AdminLeaderboardPanel';
import { AdminRequests } from '../../screens/AdminRequests';
import { AdminHostsPanel } from '../../screens/AdminHostsPanel';
import { HostDashboard } from '../../screens/HostDashboard';
import { HostTournamentPanel } from '../../screens/HostTournamentPanel';
import { HostTournamentMatchesPanel } from '../../screens/HostTournamentMatchesPanel';

const SCREENS = {
  DASHBOARD: 'dashboard',
  TOURNAMENTS: 'tournaments',
  USERS: 'users',
  WITHDRAWALS: 'withdrawals',
  DISPUTES: 'disputes',
  LEADERBOARD: 'leaderboard',
  MATCHES: 'matches',
};

export const AdminLayout = ({ mode = 'admin' }) => {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.DASHBOARD:
        return mode === 'host' ? <HostDashboard onNavigate={(screen, tournamentId) => { setSelectedTournamentId(tournamentId || null); setCurrentScreen(screen); }} /> : <AdminDashboard onNavigate={setCurrentScreen} />;
      case SCREENS.TOURNAMENTS:
        return <HostTournamentPanel onBack={() => setCurrentScreen(SCREENS.DASHBOARD)} />;
      case 'tournament-matches':
        return <HostTournamentMatchesPanel tournamentId={selectedTournamentId} onBack={() => setCurrentScreen(SCREENS.DASHBOARD)} />;
      case SCREENS.USERS:
        return <UsersPanel />;
      case SCREENS.WITHDRAWALS:
        return <WithdrawalsPanel />;
      case SCREENS.DISPUTES:
        return <DisputesPanel />;
      case SCREENS.LEADERBOARD:
        return <AdminLeaderboardPanel />;
      case SCREENS.MATCHES:
        return <AdminRequests />;
      case 'hosts':
        return <AdminHostsPanel />;
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
          mode={mode}
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
          mode={mode}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-[#1F1F1F] bg-[#111111]">
          <h1 className="text-lg font-semibold">{mode === 'host' ? 'Host Dashboard' : 'Admin Panel'}</h1>
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
