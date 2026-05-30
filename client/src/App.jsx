import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import CallModal from './components/CallModal';

// Pages
import Login from './pages/Login';
import Events from './pages/Events';
import Map from './pages/Map';
import Tasks from './pages/Tasks';
import Recurring from './pages/Recurring';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Requests from './pages/Requests';
import Alerts from './pages/Alerts';
import Chat from './pages/Chat';
import Attendance from './pages/Attendance';
import AdminDashboard from './pages/AdminDashboard';
import Kanban from './pages/Kanban';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Meetings from './pages/Meetings';
import AIPlanner from './pages/AIPlanner';
import MembersConsole from './pages/MembersConsole';
import Onboarding from './pages/Onboarding';
import PublicEvent from './pages/PublicEvent';
import AttendanceReport from './pages/AttendanceReport';
import OTPVerify from './pages/OTPVerify';

// Components
import SearchOverlay from './components/SearchOverlay';
import AnnouncementBanner from './components/AnnouncementBanner';
import PwaInstallBanner from './components/PwaInstallBanner';

import { Loader2 } from 'lucide-react';

function MainAppContent() {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('events');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Bind global Ctrl+K spotlight keydown listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Loading EventSync...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render active tab page
  const renderPage = () => {
    switch (activeTab) {
      case 'events':
        return <Events />;
      case 'map':
        return <Map />;
      case 'tasks':
        return <Tasks />;
      case 'recurring':
        return <Recurring />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'requests':
        return <Requests />;
      case 'alerts':
        return <Alerts />;
      case 'chat':
        return <Chat />;
      case 'attendance':
        return <Attendance />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'kanban':
        return <Kanban />;
      case 'profile':
        return <Profile setActiveTab={setActiveTab} />;
      case 'settings':
        return <Settings />;
      case 'meetings':
        return <Meetings />;
      case 'ai_planner':
        return <AIPlanner />;
      case 'admin_members':
        return <MembersConsole />;
      case 'attendance_report':
        return <AttendanceReport />;
      default:
        return <Events />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Block and show onboarding if user profile is incomplete and user is not in a team */}
      {user && !user.isOnboarded && !user.teamId && <Onboarding />}
      
      {/* Active Top Banners */}
      <AnnouncementBanner />

      {/* Header and Bottom Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} setIsSearchOpen={setIsSearchOpen} />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full bg-[#0a0a0a] pt-16 pb-16">
        {renderPage()}
      </main>

      {/* Persistent global widgets */}
      <Chatbot />
      <CallModal />
      <PwaInstallBanner />

      {/* Spotlight search overlay */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelect={(tabId) => {
          setActiveTab(tabId);
          setIsSearchOpen(false);
        }} 
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/events/public/:eventId" element={<PublicEvent />} />
            <Route path="/otp-verify" element={<OTPVerify />} />
            <Route path="*" element={<MainAppContent />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
