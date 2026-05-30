import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GitMerge, Plus, X, Loader2, Check, Ban } from 'lucide-react';

export default function Requests() {
  const { user, team } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/teams');
      // Filter out user's own team from option selectors
      const others = team ? res.data.filter(t => String(t._id) !== String(team._id)) : res.data;
      setTeams(others);
      if (others.length > 0) {
        setSelectedTeamId(others[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTeams();
  }, [team]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert('Please select a target team.');
      return;
    }
    setModalLoading(true);

    try {
      await axios.post('/api/requests', {
        toTeamId: selectedTeamId,
        message
      });
      setIsModalOpen(false);
      setMessage('');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/requests/${id}/status`, { status });
      // Update local state directly
      setRequests(prev =>
        prev.map(r => r._id === id ? { ...r, status } : r)
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update request status');
    }
  };

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Cross-Team Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Request collaboration, shares, and resources from other squads</p>
        </div>

        {team && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            New Request
          </button>
        )}
      </div>

      {/* Warning message if user has no team */}
      {!team && !isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs rounded-xl p-4 mb-6">
          You are not currently assigned to any team. Cross-team requests are only available to squad members.
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
          <GitMerge className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No requests yet</h3>
          <p className="text-gray-400 text-sm">Create a cross-team collaboration request to begin team coordination.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(request => {
            const isRecipient = team && String(request.toTeamId?._id || request.toTeamId) === String(team._id);
            return (
              <div 
                key={request._id}
                className="bg-[#111111] border border-gray-850 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-850 border border-gray-800 px-2 py-0.5 rounded">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                      request.status === 'accepted' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                        : request.status === 'rejected'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {/* Routing description */}
                  <div className="flex items-center space-x-2.5 mb-4 text-xs font-semibold text-white">
                    <span className="text-[#00BFFF]">{request.fromTeamId?.name}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-purple-400">{request.toTeamId?.name}</span>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{request.message}</p>
                </div>

                <div className="border-t border-gray-850 pt-3 mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <img 
                      src={request.createdBy?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.createdBy?.name || '')}`} 
                      alt="Creator"
                      className="h-5 w-5 rounded-full"
                    />
                    <span className="text-[10px] text-gray-500">{request.createdBy?.name}</span>
                  </div>

                  {/* Accept/Reject buttons for recipient squad members */}
                  {(isRecipient || isAdmin) && request.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(request._id, 'rejected')}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md border border-red-500/20"
                        title="Decline Request"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request._id, 'accepted')}
                        className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-md border border-green-500/20"
                        title="Accept Request"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Send Collaboration Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Squad</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2.5 rounded-lg text-sm"
                >
                  <option value="" disabled>Select target team</option>
                  {teams.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message / Reason</label>
                <textarea
                  placeholder="Explain what resources or coordination is needed..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none p-4 rounded-lg text-sm"
                />
              </div>

              {/* Submit Buttons */}
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
                  {modalLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
