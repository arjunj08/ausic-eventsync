import React, { useState, useContext } from 'react';
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

import { Loader2 } from 'lucide-react';

function MainAppContent() {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('events');

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
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Events />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header and Bottom Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full bg-[#0a0a0a]">
        {renderPage()}
      </main>

      {/* Persistent global widgets */}
      <Chatbot />
      <CallModal />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainAppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
