import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { 
  Calendar, 
  Map, 
  CheckSquare, 
  RefreshCw, 
  DollarSign, 
  BarChart2, 
  GitMerge, 
  Bell, 
  MessageSquare, 
  LogOut,
  Zap,
  Settings,
  MoreHorizontal,
  ClipboardCheck,
  User,
  LayoutGrid,
  X,
  Search,
  Sparkles,
  Users,
  Video
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, setIsSearchOpen }) {
  const { user, logout } = useContext(AuthContext);
  const { unreadNotifCount, unreadDMs } = useContext(SocketContext);
  
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Total unread DM count
  const totalUnreadDMs = Object.values(unreadDMs).reduce((sum, count) => sum + count, 0);

  // Main primary tabs on the bottom navigation
  const primaryTabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'kanban', label: 'Kanban', icon: CheckSquare },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadNotifCount }
  ];

  // Secondary tools in the "More" grid menu
  const secondaryTools = [
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'ai_planner', label: 'AI Planner', icon: Sparkles },
    { id: 'map', label: 'Zone Map', icon: Map },
    { id: 'recurring', label: 'Recurring Tasks', icon: RefreshCw },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'requests', label: 'Squad Requests', icon: GitMerge },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // If user is Admin, insert Admin Dashboard and Squad Roles to secondary tools
  if (user && user.role === 'admin') {
    if (!secondaryTools.some(t => t.id === 'admin_members')) {
      secondaryTools.unshift({ id: 'admin_members', label: 'Squad Roles', icon: Users });
    }
    if (!secondaryTools.some(t => t.id === 'admin_dashboard')) {
      secondaryTools.unshift({ id: 'admin_dashboard', label: 'Admin Panel', icon: LayoutGrid });
    }
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#111111] border-b border-gray-800 flex items-center justify-between px-6 z-40">
        {/* Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleTabClick('events')}>
          <Zap className="h-6 w-6 text-[#00BFFF] fill-[#00BFFF]" />
          <span className="text-xl font-bold tracking-wider text-white">
            <span className="text-[#00BFFF]">AUISC</span> EventSync
          </span>
        </div>

        {/* User Stats & Profile Controls */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Spotlight Search trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="p-2 rounded-full hover:bg-gray-850 transition-colors text-gray-400 hover:text-white"
              title="Search Workspace (Ctrl+K)"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Dedicated Chat Link */}
            <button 
              onClick={() => handleTabClick('chat')} 
              className={`relative p-2 rounded-full hover:bg-gray-850 transition-colors ${activeTab === 'chat' ? 'text-[#00BFFF]' : 'text-gray-400'}`}
              title="Chat Room"
            >
              <MessageSquare className="h-6 w-6" />
              {totalUnreadDMs > 0 && (
                <span className="absolute top-1 right-1 bg-[#22C55E] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-[#111111]">
                  {totalUnreadDMs}
                </span>
              )}
            </button>

            {/* Profile Avatar Clickable */}
            <button 
              onClick={() => handleTabClick('profile')}
              className={`flex items-center space-x-2 p-1 rounded-lg transition-colors border hover:bg-gray-850 ${
                activeTab === 'profile' ? 'border-[#00BFFF] text-[#00BFFF]' : 'border-transparent text-gray-400'
              }`}
              title="My Profile"
            >
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=7c3aed`} 
                alt={user.name} 
                className="h-8 w-8 rounded-full border border-purple-500 bg-[#7C3AED] object-cover"
              />
              <span className="text-sm font-semibold text-white hidden md:inline text-left">
                {user.name}
                <span className="block text-[10px] text-gray-450 font-normal">
                  {user.role === 'admin' ? 'Coordinator' : 'Member'}
                </span>
              </span>
            </button>

            {/* Logout Button */}
            <button 
              onClick={logout} 
              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-800"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111111] border-t border-gray-800 flex justify-around items-center px-2 z-40">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 hover:text-white transition-all relative"
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#00BFFF]' : 'text-gray-400'}`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
              <span className={`text-[10px] font-medium tracking-wide mt-0.5 transition-colors ${isActive ? 'text-[#00BFFF] font-semibold' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              
              {/* Count Badge (for Alerts) */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1.5 right-4 md:right-8 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Accent Line */}
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-[#00BFFF] rounded-t-full"></span>
              )}
            </button>
          );
        })}

        {/* More Menu Trigger Button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
            showMoreMenu || secondaryTools.some(t => t.id === activeTab) ? 'text-[#00BFFF]' : 'text-gray-400'
          }`}
        >
          <div className="p-1 rounded-lg">
            <MoreHorizontal className="h-5.5 w-5.5" />
          </div>
          <span className="text-[10px] font-medium tracking-wide mt-0.5">
            More
          </span>
          {(showMoreMenu || secondaryTools.some(t => t.id === activeTab)) && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-[#00BFFF] rounded-t-full"></span>
          )}
        </button>
      </nav>

      {/* Secondary Tools "More" Grid Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-[#0a0a0ade]/95 backdrop-blur-md z-30 flex flex-col justify-end pb-16">
          {/* Dismiss Clickable Background */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowMoreMenu(false)}></div>

          {/* Menu Card Content */}
          <div className="bg-[#111111] border-t border-gray-800 rounded-t-2xl p-6 relative max-w-xl mx-auto w-full z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="font-extrabold text-white text-md tracking-wider uppercase">Club Workspace Modules</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-850 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {secondaryTools.map((tool) => {
                const ToolIcon = tool.icon;
                const isToolActive = activeTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleTabClick(tool.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 group transition-all duration-300 ${
                      isToolActive 
                        ? 'border-[#00BFFF] bg-[#00BFFF]/5 text-[#00BFFF]' 
                        : 'border-gray-850 bg-[#181818] hover:border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <ToolIcon className="h-6 w-6" />
                    <span className="text-[10px] font-bold tracking-wide leading-tight">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
