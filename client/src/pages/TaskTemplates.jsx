import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  AlertCircle,
  Loader2,
  FolderOpen
} from 'lucide-react';

const CATEGORIES = ['cultural', 'tech_fest', 'workshop', 'hackathon'];
const PRIORITIES = ['low', 'medium', 'high'];
const TEAM_TYPES = ['Dev Force', 'Design Squad', 'Media Team', 'Logistics Team', 'Finance Team'];

export default function TaskTemplates() {
  const [templates, setTemplates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Create Template form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('cultural');
  const [tasks, setTasks] = useState([]);
  
  // Single task field builders
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskTeam, setTaskTeam] = useState('Dev Force');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDays, setTaskDueDays] = useState(5);

  const fetchTemplatesAndEvents = async () => {
    try {
      const [tplRes, evtRes] = await Promise.all([
        axios.get('/api/task-templates'),
        axios.get('/api/events')
      ]);
      setTemplates(tplRes.data);
      // Filter out completed events or allow applying to draft/pending
      setEvents(evtRes.data.filter(e => e.status !== 'completed'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load templates and events data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesAndEvents();
  }, []);

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    const newTask = {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      teamType: taskTeam,
      priority: taskPriority,
      dueDaysBeforeEvent: Number(taskDueDays)
    };

    setTasks(prev => [...prev, newTask]);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDays(5);
  };

  const handleRemoveTask = (idx) => {
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!name.trim() || tasks.length === 0) {
      toast.error('Template name and at least one task are required.');
      return;
    }

    const loadingToast = toast.loading('Saving task template...');
    try {
      const res = await axios.post('/api/task-templates', {
        name: name.trim(),
        description: description.trim(),
        eventType,
        tasks
      });
      toast.success('Template created successfully!', { id: loadingToast });
      setShowCreateModal(false);
      
      // Reset form
      setName('');
      setDescription('');
      setTasks([]);
      
      fetchTemplatesAndEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create template', { id: loadingToast });
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    const loadingToast = toast.loading('Deleting template...');
    try {
      await axios.delete(`/api/task-templates/${id}`);
      toast.success('Template deleted successfully!', { id: loadingToast });
      fetchTemplatesAndEvents();
    } catch (err) {
      toast.error('Failed to delete template', { id: loadingToast });
    }
  };

  const handleOpenApplyModal = (template) => {
    setSelectedTemplate(template);
    setShowApplyModal(true);
    if (events.length > 0) {
      setSelectedEventId(events[0]._id);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event.');
      return;
    }

    const loadingToast = toast.loading('Applying template and bulk creating tasks...');
    try {
      const res = await axios.post(`/api/task-templates/${selectedTemplate._id}/apply/${selectedEventId}`);
      toast.success(res.data.message || 'Tasks created and linked successfully! 🚀', { id: loadingToast });
      setShowApplyModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply template', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Loading Templates Console...</span>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">TASK</span> TEMPLATES
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Instantiate pre-configured task lists for cultural nights, hackathons, and technical workshops in one click.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00BFFF] text-[#0b0c10] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Template
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(tpl => (
          <div key={tpl._id} className="bg-[#111111] border border-gray-850 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-gray-800 transition-colors shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-[#00BFFF] bg-[#00BFFF]/10 border border-[#00BFFF]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {tpl.eventType.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">
                  {tpl.tasks.length} pre-defined tasks
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tpl.name}</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{tpl.description || 'No description provided.'}</p>

              {/* Collapsible preview of first 3 tasks */}
              <div className="mt-4 border-t border-gray-850/50 pt-3 space-y-2">
                {tpl.tasks.slice(0, 3).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-gray-450">
                    <span className="truncate max-w-[200px] font-medium">• {t.title}</span>
                    <span 
                      className="px-2 py-0.2 rounded text-[8px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: t.teamType === 'Dev Force' ? '#00BFFF' : t.teamType === 'Design Squad' ? '#8F5CFF' : t.teamType === 'Media Team' ? '#2ECC71' : '#e74c3c' }}
                    >
                      {t.teamType.split(' ')[0]}
                    </span>
                  </div>
                ))}
                {tpl.tasks.length > 3 && (
                  <div className="text-[10px] text-gray-600 italic font-medium">
                    + {tpl.tasks.length - 3} more tasks in this list
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-850 pt-4">
              <button
                onClick={() => handleDeleteTemplate(tpl._id)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2 rounded-xl cursor-pointer transition-colors"
                title="Delete Template"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => handleOpenApplyModal(tpl)}
                className="flex-1 bg-[#00BFFF]/10 hover:bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/30 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-101"
              >
                <Calendar className="h-4 w-4" />
                Apply to Event
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col justify-between shadow-2xl animate-scale-up">
            
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <ClipboardList className="h-5.5 w-5.5 text-[#00BFFF]" />
                  Create Custom Task Template
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-white cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-450 font-bold uppercase tracking-wider">Template Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Workshop Launch"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-450 font-bold uppercase tracking-wider">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-450 font-bold uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Provide details about what tasks this template contains..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] h-16 resize-none"
                  />
                </div>

                {/* Sub-form: Add Task checklist */}
                <div className="border border-gray-850 rounded-xl p-4 space-y-3 bg-[#161616]/30">
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Add Tasks to Template</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Task Title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                    />
                    <select
                      value={taskTeam}
                      onChange={(e) => setTaskTeam(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                    >
                      {TEAM_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Days Before"
                        value={taskDueDays}
                        onChange={(e) => setTaskDueDays(e.target.value)}
                        className="w-20 bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                        title="Due Days Before Event Date"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="flex-1 bg-[#00BFFF] text-[#0b0c10] font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer hover:bg-[#00BFFF]/80"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task list preview */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                  <label className="text-gray-450 font-bold uppercase tracking-wider">Template Task Preview ({tasks.length})</label>
                  {tasks.length === 0 ? (
                    <div className="text-center text-gray-600 italic py-4 border border-dashed border-gray-850 rounded-lg">No tasks added to template list yet.</div>
                  ) : (
                    <div className="space-y-1">
                      {tasks.map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1A1A] border border-gray-800">
                          <div>
                            <span className="text-white font-semibold">{task.title}</span>
                            <span className="text-[10px] text-gray-500 ml-2">({task.dueDaysBeforeEvent} days before)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-gray-850 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">
                              {task.teamType.split(' ')[0]}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTask(idx)}
                              className="text-red-500 hover:text-red-400 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>
            </div>

            <div className="flex gap-4 border-t border-gray-850 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 bg-[#00BFFF] text-[#0b0c10] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                disabled={tasks.length === 0}
              >
                Save Template Specification
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Apply Template Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <FolderOpen className="h-5.5 w-5.5 text-[#00BFFF]" />
                Apply "{selectedTemplate.name}"
              </h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Applying this template will bulk instantiate <strong>{selectedTemplate.tasks.length} tasks</strong> and automatically calculate their relative deadlines.</span>
              </div>

              <div className="space-y-1">
                <label className="text-gray-450 font-bold uppercase tracking-wider">Select Event Context</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                >
                  {events.length === 0 ? (
                    <option value="">No upcoming events to apply tasks to</option>
                  ) : (
                    events.map(e => (
                      <option key={e._id} value={e._id}>
                        {e.title} — {new Date(e.date).toLocaleDateString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex gap-4 border-t border-gray-850 pt-4 mt-6">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                className="flex-1 bg-[#00BFFF] text-[#0b0c10] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                disabled={events.length === 0}
              >
                Confirm Bulk Create
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
