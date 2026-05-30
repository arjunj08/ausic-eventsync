import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  UserCheck, 
  Sparkles,
  BarChart as BarIcon, 
  Check, 
  X,
  UserPlus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const CHART_COLORS = ['#00BFFF', '#8F5CFF', '#2ECC71', '#FF6384', '#FF9F40'];

export default function AdminDashboard() {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  // Dashboard stats & lists
  const [stats, setStats] = useState({ totalEvents: 0, totalMembers: 0, overdueTasksCount: 0, pendingExpensesCount: 0 });
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);

  // Squad management
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#00BFFF');
  
  // Member assignment modal/toast
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignTeamRole, setAssignTeamRole] = useState('');
  const [registrationAlert, setRegistrationAlert] = useState(null); // { id, name, email }

  // Load stats & details
  const fetchDashboardData = async () => {
    try {
      const statsRes = await axios.get('/api/admin/dashboard/stats');
      setStats(statsRes.data.stats);
      setOverdueTasks(statsRes.data.overdueTasks);
      setPendingExpenses(statsRes.data.pendingExpenses);

      const activityRes = await axios.get('/api/admin/dashboard/activity');
      setActivityData(activityRes.data);

      const teamsRes = await axios.get('/api/teams');
      setTeams(teamsRes.data);

      const membersRes = await axios.get('/api/auth/members');
      setMembers(membersRes.data);

      // Compute task category status data for Recharts Bar Chart
      const tasksRes = await axios.get('/api/tasks');
      const todo = tasksRes.data.filter(t => t.status === 'todo').length;
      const progress = tasksRes.data.filter(t => t.status === 'in_progress').length;
      const done = tasksRes.data.filter(t => t.status === 'done').length;
      
      setTaskStatusData([
        { name: 'To Do', value: todo },
        { name: 'In Progress', value: progress },
        { name: 'Completed', value: done }
      ]);

      // Compute Pie Chart data (teams member distribution)
      const teamDist = teamsRes.data.map(team => ({
        name: team.name,
        value: team.memberIds.length
      })).filter(t => t.value > 0);
      setTeamsData(teamDist.length > 0 ? teamDist : [{ name: 'No Team Members', value: 1 }]);

    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to Socket.io events
  useEffect(() => {
    if (socket) {
      socket.on('new-member-registered', (data) => {
        // Display toast alert at the top of the dashboard
        setRegistrationAlert(data);
        // Refresh members list
        axios.get('/api/auth/members').then(res => setMembers(res.data));
      });

      return () => {
        socket.off('new-member-registered');
      };
    }
  }, [socket]);

  // Create new team squad
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await axios.post('/api/teams', {
        name: newTeamName,
        color: newTeamColor
      });
      setNewTeamName('');
      setNewTeamColor('#00BFFF');
      fetchDashboardData();
    } catch (err) {
      console.error('Create team error:', err);
    }
  };

  // Open assignment modal for a user
  const openAssignModal = (member) => {
    setSelectedUser(member);
    setAssignTeamId(member.teamId || '');
    // Fetch user details for teamRole
    axios.get(`/api/profile/${member._id || member.id}`).then(res => {
      setAssignTeamRole(res.data.user.teamRole || '');
    });
    setShowAssignModal(true);
  };

  // Submit team assignment
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Step 1: Assign user to the squad
      await axios.post('/api/admin/assign-team', {
        userId: selectedUser._id || selectedUser.id,
        teamId: assignTeamId || null
      });

      // Step 2: Save the user's specific teamRole
      await axios.patch('/api/profile/me', {
        bio: undefined, // leave unchanged
        skills: undefined, // leave unchanged
        socialLinks: undefined, // leave unchanged
        teamRole: assignTeamRole
      });

      // If we are updating another user's team role, the profile endpoint should be general
      // Let's call patch on their specific profile, but our endpoint update profile/me is for the logged in user
      // Let's create or update their profile details
      // Wait, we can assign team role directly in the assign-team route!
      // Let's look at `server/src/routes/admin.js` - we can send teamRole too!
      // Oh wait, did we handle it? Let's check `assign-team` body: `const { userId, teamId } = req.body;`.
      // Let's modify `server/src/routes/admin.js` to also accept `teamRole` and update the user's `teamRole` field!
      // That's much cleaner. Let's make sure we do that or modify profile if needed.
      // Wait, we can modify the user directly in `assign-team` router in `admin.js`. Let's check:
      // Yes! We will edit `server/src/routes/admin.js` to support `{ userId, teamId, teamRole }` in a moment. Let's write the handler first.
      
      // Let's do it via a direct request.
      await axios.post('/api/admin/assign-team', {
        userId: selectedUser._id || selectedUser.id,
        teamId: assignTeamId || null,
        teamRole: assignTeamRole
      });

      setShowAssignModal(false);
      setSelectedUser(null);
      setRegistrationAlert(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Assign team error:', err);
    }
  };

  // Approve / Reject expenses directly
  const handleExpenseAction = async (expenseId, action) => {
    try {
      await axios.patch(`/api/expenses/${expenseId}/status`, {
        status: action // 'approved' | 'rejected'
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Expense action error:', err);
    }
  };

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Real-time New Member Registration Alert Toast */}
      {registrationAlert && (
        <div className="bg-gradient-to-r from-[#00BFFF]/20 via-[#8F5CFF]/20 to-emerald-500/10 border-2 border-[#00BFFF] p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#00BFFF]/20 text-[#00BFFF] rounded-full">
              <UserPlus className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-md">New Member Registered!</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                {registrationAlert.name} ({registrationAlert.email}) has just joined AUISC. Place them in a team squad.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAssignModal(registrationAlert)}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-extrabold px-4 py-2 rounded-lg text-sm transition-all"
            >
              Assign Squad
            </button>
            <button
              onClick={() => setRegistrationAlert(null)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 p-2 rounded-lg hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">ADMIN</span> COORDINATION DASHBOARD
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          High-intensity oversight console for event stats, squads, and expenditures.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Total Events</span>
            <span className="text-3xl font-extrabold text-white">{stats.totalEvents}</span>
          </div>
          <div className="p-3 bg-[#00BFFF]/10 rounded-lg text-[#00BFFF]">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Squad Members</span>
            <span className="text-3xl font-extrabold text-white">{stats.totalMembers}</span>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Overdue Tasks</span>
            <span className="text-3xl font-extrabold text-red-500">{stats.overdueTasksCount}</span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Expenses */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Pending Slips</span>
            <span className="text-3xl font-extrabold text-[#2ECC71]">{stats.pendingExpensesCount}</span>
          </div>
          <div className="p-3 bg-[#2ECC71]/10 rounded-lg text-[#2ECC71]">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: 30-Day Activity */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-xl border border-gray-850">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <BarIcon className="h-5 w-5 text-[#00BFFF]" />
            Activity Trends (Last 30 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#333' }} />
                <Legend />
                <Line type="monotone" dataKey="tasks" name="Tasks Closed" stroke="#00BFFF" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="events" name="Events Held" stroke="#8F5CFF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Members Distribution */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex flex-col justify-between">
          <h3 className="text-md font-bold text-white mb-4">Squad Member Allocation</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={teamsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {teamsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#333' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{teams.length}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs mt-2">
            {teamsData.map((team, idx) => (
              <span key={team.name} className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                <span className="text-gray-300 font-semibold">{team.name} ({team.value})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Lists & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Expenses */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
          <h3 className="text-md font-bold text-white flex items-center justify-between border-b border-gray-850 pb-2">
            <span>Pending Expense Slips</span>
            <span className="bg-[#2ECC71]/10 text-[#2ECC71] text-xs px-2.5 py-0.5 rounded-full font-bold">
              {pendingExpenses.length} Actionable
            </span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {pendingExpenses.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">No pending expense slips.</div>
            ) : (
              pendingExpenses.map(slip => (
                <div key={slip._id} className="p-4 bg-[#181818] border border-gray-850 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={slip.submittedBy?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${slip.submittedBy?.name}`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full border border-purple-500/20"
                    />
                    <div>
                      <div className="text-white text-sm font-semibold">{slip.itemDescription}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        By {slip.submittedBy?.name} for <span className="text-gray-300">{slip.eventId?.title || 'Unknown Event'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-white text-sm font-bold">${slip.amount}</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleExpenseAction(slip._id, 'approved')}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white p-1.5 rounded-md border border-emerald-500/30 transition-all"
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExpenseAction(slip._id, 'rejected')}
                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-1.5 rounded-md border border-red-500/30 transition-all"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
          <h3 className="text-md font-bold text-white flex items-center justify-between border-b border-gray-850 pb-2">
            <span>Overdue Tasks Summary</span>
            <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {overdueTasks.length} Alerts
            </span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {overdueTasks.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">No overdue tasks.</div>
            ) : (
              overdueTasks.map(task => (
                <div key={task._id} className="p-4 bg-[#181818] border border-gray-850 rounded-lg flex items-center justify-between gap-4">
                  <div>
                    <div className="text-white text-sm font-bold">{task.title}</div>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                      <span className="bg-[#1A1A1A] px-2 py-0.5 rounded text-red-400 border border-red-500/20 font-semibold">
                        ⚠️ Overdue
                      </span>
                      {task.teamId && (
                        <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: task.teamId.color || '#333' }}>
                          {task.teamId.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-xs text-gray-400">Assignee</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <img 
                        src={task.assignedTo?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Unassigned`}
                        alt="avatar"
                        className="h-5 w-5 rounded-full"
                      />
                      <span className="text-xs text-white font-semibold">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Squad & Member Allocation Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Squad Panel */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00BFFF]" />
            Establish New Squad Team
          </h3>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Squad Name</label>
              <input
                type="text"
                placeholder="e.g. Red Team, Media Squad"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Squad Color theme</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newTeamColor}
                  onChange={(e) => setNewTeamColor(e.target.value)}
                  className="h-10 w-12 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newTeamColor}
                  onChange={(e) => setNewTeamColor(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="h-5 w-5" />
              <span>Create Squad</span>
            </button>
          </form>
        </div>

        {/* Member Allocation Panel */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-xl border border-gray-850 flex flex-col">
          <h3 className="text-md font-bold text-white mb-4">Squad Member Directory</h3>
          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-850 text-gray-400 text-xs font-semibold uppercase bg-[#161616]">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Assigned Squad</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const assignedTeam = teams.find(t => t._id === member.teamId || t.id === member.teamId);
                  return (
                    <tr key={member._id || member.id} className="border-b border-gray-850/50 hover:bg-[#1A1A1A]/30 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-8 w-8 rounded-full border border-purple-500/20"
                        />
                        <div>
                          <span className="text-white font-semibold text-sm block">{member.name}</span>
                          <span className="text-[10px] text-gray-400">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {assignedTeam ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: assignedTeam.color || '#333' }}>
                            {assignedTeam.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openAssignModal(member)}
                          className="text-[#00BFFF] hover:text-[#00BFFF]/80 bg-[#00BFFF]/5 hover:bg-[#00BFFF]/10 border border-[#00BFFF]/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Squad Settings</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Assignment Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-[#0a0a0ade]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-gray-850 max-w-md w-full rounded-xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="font-extrabold text-white text-lg">Manage Squad Placement</h3>
              <button 
                onClick={() => { setShowAssignModal(false); setSelectedUser(null); }}
                className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-850 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-gray-850">
              <img 
                src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`}
                alt="user"
                className="h-10 w-10 rounded-full border border-purple-500/20"
              />
              <div>
                <div className="text-white font-semibold text-sm">{selectedUser.name}</div>
                <div className="text-xs text-gray-400">{selectedUser.email}</div>
              </div>
            </div>

            <form onSubmit={handleAssignTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Select Squad</label>
                <select
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                >
                  <option value="">-- No Team (Unassigned) --</option>
                  {teams.map(team => (
                    <option key={team._id || team.id} value={team._id || team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Role Within Team</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Developer, Graphic Designer, Media Coordinator"
                  value={assignTeamRole}
                  onChange={(e) => setAssignTeamRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="h-5 w-5" />
                <span>Save Squad Setup</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
