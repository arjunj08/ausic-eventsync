import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { Plus, X, ListTodo, Loader2, Sparkles } from 'lucide-react';

export default function Tasks() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Fetch all tasks if admin, or user tasks if member
      const url = isAdmin ? '/api/tasks' : `/api/tasks?assignedTo=${user.id}`;
      const res = await axios.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [eventsRes, teamsRes, membersRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/teams'),
        axios.get('/api/auth/members')
      ]);
      setEvents(eventsRes.data);
      setTeams(teamsRes.data);
      setMembers(membersRes.data);
      if (eventsRes.data.length > 0) {
        setSelectedEventId(eventsRes.data[0]._id);
      }
      if (teamsRes.data.length > 0) {
        setSelectedTeamId(teamsRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchDropdownData();
    }
  }, [user]);

  // Update status (called by TaskCard)
  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/tasks/${id}/status`, { status });
      // Update local state directly to be fast and responsive
      setTasks(prev => 
        prev.map(t => t._id === id ? { ...t, status } : t)
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSelectedEventId(events[0]?._id || '');
    setSelectedTeamId(teams[0]?._id || '');
    setAssignedTo('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setSelectedEventId(task.eventId?._id || task.eventId || '');
    setSelectedTeamId(task.teamId?._id || task.teamId || '');
    setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    const payload = {
      title,
      description,
      eventId: selectedEventId,
      teamId: selectedTeamId,
      assignedTo: assignedTo || null
    };

    try {
      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask._id}`, payload);
      } else {
        await axios.post('/api/tasks', payload);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to save task');
    } finally {
      setModalLoading(false);
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Filter members list based on selected team in the form
  const filteredMembers = members.filter(m => {
    if (!selectedTeamId) return true;
    const mTeam = m.teamId?._id || m.teamId;
    return String(mTeam) === String(selectedTeamId);
  });

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            {isAdmin ? 'Task Board' : 'My Tasks'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin ? 'Create, assign, and track workspace assignments' : 'Your personal to-do board'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            Assign Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
          <ListTodo className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No tasks assigned</h3>
          <p className="text-gray-400 text-sm font-medium">
            {isAdmin ? 'Create tasks to assign them to members.' : 'You have a clean slate! No tasks assigned.'}
          </p>
        </div>
      ) : (
        /* Kanban Board Style Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* TO DO Section */}
          <div className="bg-[#0f0f0f] border border-gray-850 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">To Do</span>
              <span className="bg-gray-800 text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
              {todoTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="border border-dashed border-gray-850 rounded-xl p-6 text-center text-xs text-gray-500 italic">
                  No tasks to do
                </div>
              )}
            </div>
          </div>

          {/* IN PROGRESS Section */}
          <div className="bg-[#0f0f0f] border border-gray-850 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">In Progress</span>
              <span className="bg-[#00BFFF]/20 border border-[#00BFFF]/30 text-[#00BFFF] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
              {inProgressTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="border border-dashed border-gray-850 rounded-xl p-6 text-center text-xs text-gray-500 italic">
                  No tasks in progress
                </div>
              )}
            </div>
          </div>

          {/* DONE Section */}
          <div className="bg-[#0f0f0f] border border-gray-850 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Completed</span>
              <span className="bg-green-500/20 border border-green-500/30 text-green-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {doneTasks.length}
              </span>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
              {doneTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="border border-dashed border-gray-850 rounded-xl p-6 text-center text-xs text-gray-500 italic">
                  No completed tasks
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Admin Task Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">
                {editingTask ? 'Edit Task Details' : 'Create & Assign Task'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design slide deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Provide checklist requirements, format constraints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none p-4 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Scope</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="" disabled>Select event</option>
                    {events.map(e => (
                      <option key={e._id} value={e._id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Scope</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setAssignedTo(''); // Reset assignee since team changed
                    }}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="" disabled>Select team</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Assignee Member</span>
                  <span className="text-[10px] text-gray-500 font-normal normal-case">Filtered by Selected Team</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="">Unassigned (Open task)</option>
                  {filteredMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-855 pt-4 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-gray-850 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center"
                >
                  {modalLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
