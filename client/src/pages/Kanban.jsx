import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle,
  ArrowRight, 
  ArrowLeft,
  Trash2,
  CheckCircle,
  Play,
  ClipboardList
} from 'lucide-react';
import { DndContext, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';

export default function Kanban() {
  const { user } = useContext(AuthContext);
  
  // Data lists
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);

  // Filtering states
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Task creation states
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTeamId, setTaskTeamId] = useState('');
  const [taskEventId, setTaskEventId] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [loading, setLoading] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, teamsRes, membersRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/teams'),
        axios.get('/api/auth/members')
      ]);

      setEvents(eventsRes.data);
      setTeams(teamsRes.data);
      setMembers(membersRes.data);

      // Fetch tasks
      const tasksRes = await axios.get('/api/tasks');
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Fetch Kanban data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update status call
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      // Update locally
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Handle Drag End event
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const overId = over.id; // column status: 'todo', 'in_progress', 'done'

    if (['todo', 'in_progress', 'done'].includes(overId)) {
      const task = tasks.find(t => t._id === taskId);
      if (task && task.status !== overId) {
        updateTaskStatus(taskId, overId);
      }
    }
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskTeamId || !taskEventId) return;

    try {
      const res = await axios.post('/api/tasks', {
        title: taskTitle,
        description: taskDescription,
        teamId: taskTeamId,
        eventId: taskEventId,
        assignedTo: taskAssignedTo || null,
        dueDate: taskDueDate || null
      });

      setShowAddModal(false);
      // Reset inputs
      setTaskTitle('');
      setTaskDescription('');
      setTaskTeamId('');
      setTaskEventId('');
      setTaskAssignedTo('');
      setTaskDueDate('');

      // Refresh tasks
      const tasksRes = await axios.get('/api/tasks');
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  // Delete Task (Admin only)
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  // Filter conditions
  const filteredTasks = tasks.filter(task => {
    const matchesEvent = !selectedEventId || String(task.eventId?._id || task.eventId) === String(selectedEventId);
    const matchesTeam = !selectedTeamId || String(task.teamId?._id || task.teamId) === String(selectedTeamId);
    const matchesAssignee = !selectedAssigneeId || String(task.assignedTo?._id || task.assignedTo) === String(selectedAssigneeId);
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesEvent && matchesTeam && matchesAssignee && matchesSearch;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  // Render Single Task Card
  const renderTaskCard = (task) => {
    const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
    const taskTeam = teams.find(t => t._id === (task.teamId?._id || task.teamId));

    return (
      <div 
        key={task._id} 
        className="bg-[#181818] border border-gray-850 p-4 rounded-xl space-y-3 shadow-md hover:border-gray-700 transition-all flex flex-col justify-between"
      >
        <div className="space-y-1">
          {/* Team Indicator */}
          {taskTeam && (
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: taskTeam.color || '#333' }}>
              {taskTeam.name}
            </span>
          )}
          
          <h4 className="font-bold text-white text-sm tracking-wide mt-1">{task.title}</h4>
          <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>
        </div>

        {/* Info Grid */}
        <div className="text-[11px] text-gray-500 space-y-1 bg-[#121212]/50 p-2 rounded-lg">
          {task.eventId?.title && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#00BFFF]" />
              <span className="truncate">{task.eventId.title}</span>
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-semibold' : ''}`}>
              <Clock className="h-3 w-3" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between border-t border-gray-850 pt-2.5">
          <div className="flex items-center gap-1.5">
            <img 
              src={task.assignedTo?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Unassigned`}
              alt="assignee"
              className="h-6 w-6 rounded-full"
              title={task.assignedTo?.name || 'Unassigned'}
            />
            <span className="text-[11px] text-gray-400 truncate max-w-[80px]">{task.assignedTo?.name || 'Unassigned'}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Left Button */}
            {task.status === 'in_progress' && (
              <button 
                onClick={() => updateTaskStatus(task._id, 'todo')}
                className="p-1 rounded bg-[#2A2A2A] hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Move to To Do"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {task.status === 'done' && (
              <button 
                onClick={() => updateTaskStatus(task._id, 'in_progress')}
                className="p-1 rounded bg-[#2A2A2A] hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Move to In Progress"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Right Button */}
            {task.status === 'todo' && (
              <button 
                onClick={() => updateTaskStatus(task._id, 'in_progress')}
                className="p-1 rounded bg-[#2A2A2A] hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Move to In Progress"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            {task.status === 'in_progress' && (
              <button 
                onClick={() => updateTaskStatus(task._id, 'done')}
                className="p-1 rounded bg-[#2A2A2A] hover:bg-gray-700 text-emerald-400 hover:text-emerald-350"
                title="Move to Completed"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete button for Admin only */}
            {user.role === 'admin' && (
              <button 
                onClick={() => handleDeleteTask(task._id)}
                className="p-1 rounded bg-[#2A2A2A] hover:bg-red-500/20 text-gray-400 hover:text-red-400 ml-1.5"
                title="Delete Task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">KANBAN</span> BOARD
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track squad deliverables and task status in real time.
          </p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-extrabold px-5 py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <div className="bg-[#111111] p-4 rounded-xl border border-gray-850 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
          />
        </div>

        {/* Event Filter */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF] cursor-pointer"
        >
          <option value="">All Events</option>
          {events.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>

        {/* Team Filter */}
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF] cursor-pointer"
        >
          <option value="">All Squads</option>
          {teams.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={selectedAssigneeId}
          onChange={(e) => setSelectedAssigneeId(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF] cursor-pointer"
        >
          <option value="">All Assignees</option>
          {members.map(m => (
            <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Column: To Do */}
        <div className="bg-[#111111] p-4 rounded-xl border border-gray-850 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-gray-850 pb-2">
            <h3 className="font-extrabold text-white text-md flex items-center gap-1.5">
              <ClipboardList className="h-5 w-5 text-gray-400" />
              <span>To Do</span>
            </h3>
            <span className="bg-[#2A2A2A] text-gray-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px] overflow-y-auto max-h-[60vh] pr-1">
            {todoTasks.map(renderTaskCard)}
            {todoTasks.length === 0 && (
              <div className="text-center py-12 text-gray-650 text-xs italic">No tasks in queue.</div>
            )}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="bg-[#111111] p-4 rounded-xl border border-gray-850 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-gray-850 pb-2">
            <h3 className="font-extrabold text-white text-md flex items-center gap-1.5">
              <Play className="h-5 w-5 text-[#00BFFF]" />
              <span>In Progress</span>
            </h3>
            <span className="bg-[#00BFFF]/10 text-[#00BFFF] text-xs px-2 py-0.5 rounded-full font-bold">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px] overflow-y-auto max-h-[60vh] pr-1">
            {inProgressTasks.map(renderTaskCard)}
            {inProgressTasks.length === 0 && (
              <div className="text-center py-12 text-gray-650 text-xs italic">No active works.</div>
            )}
          </div>
        </div>

        {/* Column: Completed */}
        <div className="bg-[#111111] p-4 rounded-xl border border-gray-850 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-gray-850 pb-2">
            <h3 className="font-extrabold text-white text-md flex items-center gap-1.5">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span>Done</span>
            </h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {doneTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px] overflow-y-auto max-h-[60vh] pr-1">
            {doneTasks.map(renderTaskCard)}
            {doneTasks.length === 0 && (
              <div className="text-center py-12 text-gray-650 text-xs italic">No items completed yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Task Creation Modal (Admin only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0a0ade]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-gray-850 max-w-lg w-full rounded-xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="font-extrabold text-white text-lg">Create Coordinate Task</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-850 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design Event Poster"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Description</label>
                <textarea
                  placeholder="Provide scope guidelines..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-24 resize-none"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Assign Squad</label>
                  <select
                    value={taskTeamId}
                    onChange={(e) => setTaskTeamId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                    required
                  >
                    <option value="">-- Choose Squad --</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Associated Event</label>
                  <select
                    value={taskEventId}
                    onChange={(e) => setTaskEventId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                    required
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map(ev => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Assign Person</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map(m => (
                      <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 mt-4"
              >
                <Plus className="h-5 w-5" />
                <span>Publish Task</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
