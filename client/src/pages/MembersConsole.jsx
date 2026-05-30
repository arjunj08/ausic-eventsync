import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Shield, 
  Search, 
  UserCheck, 
  Settings, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
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
  
  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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
      setErrorMsg('Failed to load member directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndTeams();
  }, []);

  // Update subRole API call
  const handleSubroleChange = async (userId, newSubrole) => {
    setUpdatingId(userId);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await axios.patch(`/api/users/${userId}/subrole`, { subRole: newSubrole });
      setSuccessMsg('Member subrole permissions updated successfully!');
      // Update local list
      setMembers(prev => prev.map(m => (m._id || m.id) === userId ? { ...m, subRole: newSubrole } : m));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update subrole.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="pt-24 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">ROLES &</span> PERMISSIONS
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Adjust authorization scopes and subrole capabilities for AUISC club coordinates.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Directory list card */}
      <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden flex flex-col">
        
        {/* Controls Bar */}
        <div className="p-6 border-b border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00BFFF]" />
            Club Member Authorization Console
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-850 text-gray-450 text-xs font-bold uppercase tracking-wider bg-[#161616]">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Assigned Team</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Authorization Subrole</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-650 text-sm">
                    No members match the search query.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const assignedTeam = teams.find(t => {
                    const tId = t._id || t.id;
                    const mTeamId = (member.teamId && typeof member.teamId === 'object') 
                      ? (member.teamId._id || member.teamId.id) 
                      : member.teamId;
                    return tId === mTeamId;
                  });
                  const isUpdating = updatingId === (member._id || member.id);

                  return (
                    <tr key={member._id || member.id} className="border-b border-gray-850/50 hover:bg-[#1A1A1A]/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-9 w-9 rounded-full border border-purple-500/20 object-cover"
                        />
                        <div>
                          <div className="text-white font-semibold text-sm">{member.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{member.email}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {assignedTeam ? (
                          <span 
                            className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider" 
                            style={{ backgroundColor: assignedTeam.color || '#333' }}
                          >
                            {assignedTeam.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          member.role === 'admin' ? 'bg-[#00BFFF]/10 text-[#00BFFF]' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {member.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={member.subRole || 'member'}
                            onChange={(e) => handleSubroleChange(member._id || member.id, e.target.value)}
                            disabled={isUpdating}
                            className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#00BFFF] cursor-pointer disabled:opacity-50"
                          >
                            {SUBROLES.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {isUpdating && <Loader2 className="h-4.5 w-4.5 text-[#00BFFF] animate-spin" />}
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

    </div>
  );
}
