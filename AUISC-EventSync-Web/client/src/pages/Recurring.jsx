import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, X, RefreshCw, Loader2, Sparkles } from 'lucide-react';

export default function Recurring() {
  const { user } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const runScheduler = async () => {
    try {
      // Trigger recurring task auto-generation on mount
      await axios.post('/api/tasks/recurring/trigger');
    } catch (err) {
      console.warn('Failed to run scheduler trigger:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tasks/recurring/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/teams');
      setTeams(res.data);
      if (res.data.length > 0) {
        setSelectedTeamId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Run task generation trigger first, then fetch templates
    runScheduler().then(() => {
      fetchTemplates();
      fetchTeams();
    });
  }, []);

  const handleToggleActive = async (id) => {
    try {
      const res = await axios.patch(`/api/tasks/recurring/templates/${id}/toggle`);
      setTemplates(prev =>
        prev.map(t => t._id === id ? { ...t, isActive: res.data.isActive } : t)
      );
    } catch (err) {
      console.error(err);
      alert('Failed to toggle template status');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    const payload = {
      title,
      description,
      frequency,
      teamId: selectedTeamId
    };

    try {
      await axios.post('/api/tasks/recurring/templates', payload);
      setIsModalOpen(false);
      // Re-trigger and fetch updated lists
      await runScheduler();
      fetchTemplates();
      
      // Reset form
      setTitle('');
      setDescription('');
      setFrequency('weekly');
    } catch (err) {
      console.error(err);
      alert('Failed to create template');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Recurring Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">Automate repeating assignments for your team</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            New Template
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
          <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="text-lg font-bold text-white mb-1">No Recurring Tasks</h3>
          <p className="text-gray-400 text-sm font-medium">Create templates to automatically trigger tasks each cycle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div 
              key={template._id}
              className="bg-[#111111] border border-gray-850 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-[#00BFFF] uppercase tracking-wider bg-[#00BFFF]/10 border border-[#00BFFF]/30 px-2 py-0.5 rounded-full">
                    {template.frequency}
                  </span>
                  
                  {/* Active Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={template.isActive} 
                      onChange={() => handleToggleActive(template._id)}
                      className="sr-only peer"
                      disabled={!isAdmin}
                    />
                    <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white border border-gray-700"></div>
                  </label>

                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{template.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">{template.description}</p>
              </div>

              <div className="border-t border-gray-850 pt-3 mt-4 flex items-center justify-between">
                {/* Team tag */}
                <div className="flex items-center space-x-2">
                  <span 
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: template.teamId?.color || '#7C3AED' }}
                  ></span>
                  <span className="text-xs text-gray-400 font-medium">{template.teamId?.name || 'Assigned Team'}</span>
                </div>
                
                <span className={`text-[10px] font-bold tracking-wider uppercase ${template.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                  {template.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Create Repeating Task Template</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Template Title</label>
                <input
                  type="text"
                  placeholder="e.g. Update design deliverables list"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Provide default details of instructions that will be assigned each cycle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none p-4 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assign to Squad</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
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
                  {modalLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
