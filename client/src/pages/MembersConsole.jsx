import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  Building2,
  CheckSquare,
  Square
} from 'lucide-react';

const SUBROLES = [
  { value: 'member', label: 'Member' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'coordinator', label: 'Coordinator' }
];

export default function MembersConsole() {
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection/Bulk state
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [teamFilter, setTeamFilter] = useState('all'); // all, unassigned, or teamId

  // Modals state
  const [removingUser, setRemovingUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);

  // Suspension inputs
  const [suspendDuration, setSuspendDuration] = useState('1d');
  const [customDate, setCustomDate] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const fetchMembersAndTeams = async () => {
    try {
      const [membersRes, teamsRes] = await Promise.all([
        axios.get('/api/auth/members'),
        axios.get('/api/teams')
      ]);
      setMembers(membersRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load member directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndTeams();
  }, []);

  // Update subRole API call
  const handleSubroleChange = async (userId, newSubrole) => {
    const loadingToast = toast.loading('Updating member subrole...');
    try {
      await axios.patch(`/api/users/${userId}/subrole`, { subRole: newSubrole });
      toast.success('Member permissions updated successfully!', { id: loadingToast });
      setMembers(prev => prev.map(m => (m._id || m.id) === userId ? { ...m, subRole: newSubrole } : m));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update subrole.', { id: loadingToast });
    }
  };

  // Assign Team API call
  const handleAssignTeam = async (userId, teamId) => {
    const loadingToast = toast.loading('Assigning squad team...');
    try {
      if (teamId) {
        await axios.patch(`/api/users/${userId}/assign-team`, { teamId });
        toast.success('Squad team assigned successfully!', { id: loadingToast });
      } else {
        await axios.patch(`/api/users/${userId}/unassign-team`);
        toast.success('Member removed from squad team.', { id: loadingToast });
      }
      fetchMembersAndTeams();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to modify team assignment.', { id: loadingToast });
    }
  };

  // Bulk assign team API call
  const handleBulkAssignTeam = async (teamId) => {
    if (selectedUserIds.length === 0) {
      toast.error('No members selected.');
      return;
    }
    const loadingToast = toast.loading('Executing bulk team assignment...');
    try {
      await axios.patch('/api/admin/bulk-assign-team', {
        userIds: selectedUserIds,
        teamId
      });
      toast.success('Bulk team assignment completed!', { id: loadingToast });
      setSelectedUserIds([]);
      fetchMembersAndTeams();
    } catch (err) {
      toast.error('Failed to execute bulk team assignment.', { id: loadingToast });
    }
  };

  // Deactivate User API call
  const handleDeactivateUser = async () => {
    if (!removingUser) return;
    const loadingToast = toast.loading('Deactivating member credentials...');
    try {
      const uId = removingUser._id || removingUser.id;
      await axios.patch(`/api/admin/users/${uId}/deactivate`);
      toast.success('Member deactivated successfully.', { id: loadingToast });
      setRemovingUser(null);
      fetchMembersAndTeams();
    } catch (err) {
      toast.error('Failed to deactivate user.', { id: loadingToast });
    }
  };

  // Permanently Delete User API call
  const handlePermanentDeleteUser = async () => {
    if (!removingUser) return;
    if (!window.confirm(`⚠️ WARNING: Are you absolutely sure you want to permanently delete ${removingUser.name}? This removes all their tasks, roles, and cannot be undone.`)) return;

    const loadingToast = toast.loading('Permanently deleting account...');
    try {
      const uId = removingUser._id || removingUser.id;
      await axios.delete(`/api/admin/users/${uId}`);
      toast.success('User permanently deleted from EventSync.', { id: loadingToast });
      setRemovingUser(null);
      fetchMembersAndTeams();
    } catch (err) {
      toast.error('Failed to permanently delete user.', { id: loadingToast });
    }
  };

  // Reactivate User API call
  const handleReactivateUser = async (userId) => {
    const loadingToast = toast.loading('Reactivating user account...');
    try {
      await axios.patch(`/api/admin/users/${userId}/reactivate`);
      toast.success('User reactivated successfully!', { id: loadingToast });
      fetchMembersAndTeams();
    } catch (err) {
      toast.error('Failed to reactivate user account.', { id: loadingToast });
    }
  };

  // Suspend User API call
  const handleSuspendUser = async (e) => {
    e.preventDefault();
    if (!suspendingUser) return;

    const duration = suspendDuration === 'custom' ? customDate : suspendDuration;
    if (!duration) {
      toast.error('Please specify a suspension duration');
      return;
    }

    const loadingToast = toast.loading('Suspending user account...');
    try {
      const uId = suspendingUser._id || suspendingUser.id;
      await axios.patch(`/api/admin/users/${uId}/suspend`, {
        duration,
        reason: suspendReason
      });
      toast.success('Member suspended successfully.', { id: loadingToast });
      setSuspendingUser(null);
      setSuspendReason('');
      fetchMembersAndTeams();
    } catch (err) {
      toast.error('Failed to suspend user.', { id: loadingToast });
    }
  };

  // Selection toggles
  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (visibleUsers) => {
    const visibleIds = visibleUsers.map(u => u._id || u.id);
    const allSelected = visibleIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedUserIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // Filters application
  const filteredMembers = members.filter(m => {
    // 1. Search term filter
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Team filter
    const mTeamId = m.teamId?._id || m.teamId?.id || m.teamId;
    if (teamFilter === 'unassigned') {
      return !mTeamId;
    } else if (teamFilter !== 'all') {
      return String(mTeamId) === String(teamFilter);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="pt-24 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div className="border-b border-gray-850 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">ADMINISTRATIVE</span> MEMBER PORTAL
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Sync squads team assignment, deactivate coordinator accounts, or temporarily suspend system access.
        </p>
      </div>

      {/* Warning/Statistics Dashboard Card */}
      {members.filter(m => !m.teamId && m.role === 'member').length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
            <div>
              <div className="text-white font-bold text-sm">Unassigned Members Warning</div>
              <div className="text-gray-400 mt-0.5">
                {members.filter(m => !m.teamId && m.role === 'member').length} members have no team assigned.
              </div>
            </div>
          </div>
          <button
            onClick={() => setTeamFilter('unassigned')}
            className="bg-amber-500 text-black font-bold uppercase px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-600"
          >
            Filter Unassigned
          </button>
        </div>
      )}

      {/* Directory Console */}
      <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden flex flex-col">
        
        {/* Controls, Filters & Bulk Actions Bar */}
        <div className="p-6 border-b border-gray-850 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
              />
            </div>

            {/* Team Filter Pills */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <button
                onClick={() => setTeamFilter('all')}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                  teamFilter === 'all' ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]' : 'border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setTeamFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                  teamFilter === 'unassigned' ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]' : 'border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Unassigned
              </button>
              {teams.map(t => (
                <button
                  key={t._id}
                  onClick={() => setTeamFilter(t._id)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    teamFilter === t._id ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]' : 'border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedUserIds.length > 0 && (
            <div className="bg-[#1A1A1A] p-3 rounded-lg border border-gray-850 flex items-center justify-between text-xs gap-4 animate-scale-up">
              <div className="text-gray-400 font-medium">
                Selected <span className="text-[#00BFFF] font-bold">{selectedUserIds.length}</span> members
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Bulk Assign Team:</span>
                <select
                  onChange={(e) => handleBulkAssignTeam(e.target.value)}
                  defaultValue=""
                  className="bg-[#111111] border border-gray-800 text-white rounded-lg px-3 py-1.5 text-xs cursor-pointer focus:outline-none focus:border-[#00BFFF]"
                >
                  <option value="" disabled>Select Squad...</option>
                  <option value="unassign">Unassign / Remove</option>
                  {teams.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Members Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-850 text-gray-450 font-bold uppercase tracking-wider bg-[#161616]">
                <th className="px-6 py-4 w-12 text-center">
                  <button 
                    onClick={() => handleSelectAll(filteredMembers)}
                    className="text-gray-500 hover:text-white cursor-pointer"
                  >
                    {filteredMembers.length > 0 && filteredMembers.every(u => selectedUserIds.includes(u._id || u.id)) ? (
                      <CheckSquare className="h-4.5 w-4.5 text-[#00BFFF]" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Avatar & Name</th>
                <th className="px-6 py-4">Current Team</th>
                <th className="px-6 py-4">Sub-Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-650 font-medium">
                    No members match selected filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const mId = member._id || member.id;
                  const mTeamId = member.teamId?._id || member.teamId?.id || member.teamId;
                  const isSelected = selectedUserIds.includes(mId);

                  return (
                    <tr key={mId} className={`border-b border-gray-850/50 hover:bg-[#1A1A1A]/30 transition-colors ${
                      member.status === 'inactive' ? 'opacity-40' : ''
                    }`}>
                      
                      {/* Checkbox Select */}
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleSelectUser(mId)}
                          className="text-gray-500 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#00BFFF]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-9 w-9 rounded-full border border-purple-500/20 object-cover"
                        />
                        <div>
                          <div className="text-white font-semibold text-sm">{member.name}</div>
                          <div className="text-gray-500 mt-0.5">{member.email}</div>
                        </div>
                      </td>

                      {/* Team Assignment dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={mTeamId || ''}
                          onChange={(e) => handleAssignTeam(mId, e.target.value)}
                          className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer font-semibold uppercase text-[9px] tracking-wider"
                          style={{ color: mTeamId ? (teams.find(t => t._id === mTeamId)?.color || '#fff') : '#888' }}
                        >
                          <option value="">Unassigned</option>
                          {teams.map(t => (
                            <option key={t._id} value={t._id} style={{ color: t.color }}>{t.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Sub Role dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={member.subRole || 'member'}
                          onChange={(e) => handleSubroleChange(mId, e.target.value)}
                          className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                        >
                          {SUBROLES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Status Badges */}
                      <td className="px-6 py-4">
                        {member.status === 'suspended' ? (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase cursor-help"
                            title={`Suspended until ${new Date(member.suspendedUntil).toLocaleDateString()}. Reason: ${member.suspensionReason || 'None'}`}
                          >
                            Suspended
                          </span>
                        ) : member.status === 'inactive' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-850 text-gray-500 border border-gray-800 uppercase">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {member.status === 'inactive' ? (
                            <button
                              onClick={() => handleReactivateUser(mId)}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setSuspendingUser(member)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg cursor-pointer"
                                title="Suspend Coordinator"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setRemovingUser(member)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg cursor-pointer"
                                title="Remove User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 1. Remove User (Confirmation Modal) */}
      <AnimatePresence>
        {removingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-5"
            >
              <div className="flex items-start gap-3 text-red-500">
                <AlertTriangle className="h-8 w-8 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-white text-base">Remove User: {removingUser.name}?</h3>
                  <p className="text-gray-400 mt-1 leading-normal">
                    Are you sure you want to remove this user? Removing them will unassign their tasks and restrict system access.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-850">
                <button
                  onClick={handleDeactivateUser}
                  className="w-full bg-gray-850 hover:bg-gray-800 border border-gray-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Deactivate (Soft Delete)
                </button>
                <button
                  onClick={handlePermanentDeleteUser}
                  className="w-full bg-red-600/10 hover:bg-red-650/20 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Permanently Delete (Hard Delete)
                </button>
                <button
                  onClick={() => setRemovingUser(null)}
                  className="w-full bg-transparent hover:bg-gray-900 text-gray-500 py-2 rounded-xl font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Suspend User Modal */}
      <AnimatePresence>
        {suspendingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-xs space-y-4"
            >
              
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Suspend: {suspendingUser.name}
                </h3>
                <button onClick={() => setSuspendingUser(null)} className="text-gray-500 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSuspendUser} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-gray-450 font-bold uppercase tracking-wider">Duration</label>
                  <select
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white cursor-pointer focus:outline-none focus:border-[#00BFFF]"
                  >
                    <option value="1d">1 Day</option>
                    <option value="3d">3 Days</option>
                    <option value="1w">1 Week</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                {suspendDuration === 'custom' && (
                  <div className="space-y-1">
                    <label className="text-gray-450 font-bold uppercase tracking-wider">Custom Expiry Date</label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-gray-450 font-bold uppercase tracking-wider">Reason Note</label>
                  <textarea
                    placeholder="Reason for suspension..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white h-20 resize-none focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                <div className="flex gap-4 border-t border-gray-850 pt-4">
                  <button
                    type="button"
                    onClick={() => setSuspendingUser(null)}
                    className="flex-1 bg-gray-850 hover:bg-gray-800 text-white py-2 rounded-xl font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold uppercase cursor-pointer hover:bg-amber-600"
                  >
                    Apply Suspension
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
