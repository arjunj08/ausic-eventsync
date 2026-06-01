import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Building2, 
  Plus, 
  Search, 
  Loader2, 
  X, 
  Users, 
  ArrowLeft,
  GripVertical
} from 'lucide-react';

// Sortable item wrapper for member cards
function SortableMemberCard({ member, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member._id || member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-[#111111] border border-gray-850 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg select-none group"
    >
      <div className="flex items-center gap-3">
        {/* Grip Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <img 
          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
          alt={member.name}
          className="h-9 w-9 rounded-full border border-purple-500/20 object-cover"
        />
        <div>
          <h4 className="text-sm font-semibold text-white">{member.name}</h4>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{member.subRole.replace('_', ' ')}</p>
        </div>
      </div>

      <button
        onClick={() => onRemove(member._id || member.id)}
        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]); // List of current members sorted/ordered
  const [loading, setLoading] = useState(true);

  // Search Add Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [modalSearch, setModalSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTeamData = async () => {
    try {
      const res = await axios.get(`/api/teams/${teamId}`);
      setTeam(res.data);
      setMembers(res.data.memberIds || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('/api/auth/members');
      setAllUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  useEffect(() => {
    if (showAddModal) {
      fetchAllUsers();
    }
  }, [showAddModal]);

  const handleAddMember = async (userId) => {
    const loadingToast = toast.loading('Adding coordinator to team...');
    try {
      await axios.post(`/api/teams/${teamId}/add-member`, { userId });
      toast.success('Coordinator added successfully! 🎉', { id: loadingToast });
      setShowAddModal(false);
      fetchTeamData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member.', { id: loadingToast });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this coordinator from the team?')) return;
    const loadingToast = toast.loading('Removing coordinator from team...');
    try {
      await axios.delete(`/api/teams/${teamId}/remove-member/${userId}`);
      toast.success('Coordinator removed successfully.', { id: loadingToast });
      fetchTeamData();
    } catch (err) {
      toast.error('Failed to remove coordinator.', { id: loadingToast });
    }
  };

  // Drag and drop sorting handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setMembers((items) => {
        const oldIndex = items.findIndex((i) => (i._id || i.id) === active.id);
        const newIndex = items.findIndex((i) => (i._id || i.id) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Loading Team Roster...</span>
      </div>
    );
  }

  // Filter users not currently in this team
  const filteredUsers = allUsers.filter(u => {
    const isCurrentMember = members.some(m => String(m._id || m.id) === String(u._id || u.id));
    if (isCurrentMember) return false;

    if (!modalSearch) return true;
    return u.name.toLowerCase().includes(modalSearch.toLowerCase()) || 
           u.email.toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar activeTab="" setActiveTab={() => {}} setIsSearchOpen={() => {}} />

      <main className="flex-1 w-full max-w-5xl mx-auto pt-24 pb-24 px-4 md:px-8 space-y-6">
        
        {/* Breadcrumb back */}
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Team Header banner */}
        <div className="bg-[#111111] border border-gray-850 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: team.color }}>
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{team.name}</h1>
              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#00BFFF]" />
                {members.length} members assigned
              </p>
            </div>
          </div>

          {user && user.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#00BFFF] text-[#0b0c10] font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Member
            </button>
          )}
        </div>

        {/* Member cards grid with sorting */}
        {members.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-gray-850 rounded-xl p-12 text-center text-gray-500 text-sm">
            👥 No members are currently assigned to this squad.
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={members.map(m => m._id || m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map(m => (
                  <SortableMemberCard 
                    key={m._id || m.id} 
                    member={m} 
                    onRemove={handleRemoveMember} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

      </main>

      {/* Add Member Search Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up flex flex-col justify-between max-h-[80vh]">
            
            <div>
              <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
                <h3 className="font-extrabold text-white text-base">
                  Add Coordinator to {team.name}
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-500 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                />
              </div>

              {/* Search results list */}
              <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-1 no-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-650 text-xs italic py-8">No unassigned members found.</div>
                ) : (
                  filteredUsers.map(u => (
                    <div 
                      key={u._id || u.id}
                      onClick={() => handleAddMember(u._id || u.id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-850/50 bg-[#161616]/30 hover:bg-[#1A1A1A] hover:border-[#00BFFF]/30 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                          alt="" 
                          className="h-7 w-7 rounded-full border border-purple-500/20"
                        />
                        <div>
                          <div className="text-xs text-white font-semibold group-hover:text-[#00BFFF] transition-colors">{u.name}</div>
                          <div className="text-[10px] text-gray-500">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Select
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-6 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close List
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
