export const AdminSidebar = ({ currentScreen, onScreenChange, isMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'requests', label: 'Requests', icon: '📝' },
    { id: 'live_matches', label: 'Live Matches', icon: '🎮' },
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💸' },
    { id: 'logs', label: 'Logs', icon: '📜' },
  ];

  return (
    <div className="h-full bg-[#111111] border-r border-[#1F1F1F] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#1F1F1F]">
        <h2 className="text-xl font-bold text-[#FF6A00]">ADMIN</h2>
        <p className="text-xs text-[#A1A1A1] mt-1">Operations Control</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              currentScreen === item.id
                ? 'bg-[#FF6A00] text-black'
                : 'text-[#A1A1A1] hover:bg-[#1F1F1F] hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1F1F1F] text-xs text-[#A1A1A1]">
        <div className="space-y-2">
          <div>Status: <span className="text-[#22C55E]">Online</span></div>
          <button className="w-full px-4 py-2 rounded-lg border border-[#1F1F1F] hover:border-[#FF6A00] text-[#FF6A00] text-xs font-medium transition">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
