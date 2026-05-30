import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  Plus, 
  X, 
  Camera, 
  Save, 
  CheckCircle, 
  Users, 
  Star, 
  DollarSign,
  Loader2,
  GitMerge
} from 'lucide-react';

const BADGE_INFO = {
  'Team Player': {
    description: 'Awarded for joining an active club squad.',
    icon: Users,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
  },
  'First Task': {
    description: 'Awarded for completing your first assigned Kanban task.',
    icon: CheckCircle,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
  },
  'Event Star': {
    description: 'Awarded for checking in to 3 or more club events.',
    icon: Star,
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
  },
  'Budget Keeper': {
    description: 'Awarded for having an approved expense slip.',
    icon: DollarSign,
    color: 'text-green-400 border-green-500/30 bg-green-500/10'
  }
};

export default function Profile() {
  const { user: currentUser, refreshUser } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState(null);
  const [profileTeam, setProfileTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [bio, setBio] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', github: '', instagram: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/profile/me');
      const u = res.data.user;
      setProfileUser(u);
      setProfileTeam(res.data.team);
      
      // Initialize edit fields
      setBio(u.bio || '');
      setTeamRole(u.teamRole || '');
      setSkills(u.skills || []);
      setSocialLinks(u.socialLinks || { linkedin: '', github: '', instagram: '' });
      setAvatarPreview(u.avatar || '');
    } catch (err) {
      console.error('Fetch profile error:', err);
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    // Auto-upload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setSaving(true);
      const res = await axios.post('/api/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Avatar updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshUser();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to upload avatar');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Handle add skill
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    setSkills(prev => [...prev, newSkill.trim()]);
    setNewSkill('');
  };

  // Handle remove skill
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Submit Profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await axios.patch('/api/profile/me', {
        bio,
        skills,
        socialLinks,
        teamRole
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchProfile();
      refreshUser();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">MEMBER</span> PROFILE
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Customize your credentials and review squad assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Avatar Card, Badges, Team Details */}
        <div className="space-y-6">
          
          {/* Avatar and Info Card */}
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex flex-col items-center text-center relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00BFFF] via-[#8F5CFF] to-[#2ECC71]"></div>

            <div className="relative group mt-2 mb-4">
              <img 
                src={avatarPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileUser.name)}`}
                alt={profileUser.name}
                className="h-28 w-28 rounded-full border-2 border-purple-500 object-cover bg-[#7C3AED]"
              />
              <label 
                htmlFor="avatar-file"
                className="absolute inset-0 bg-[#000000bf] rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
                <input 
                  type="file" 
                  id="avatar-file"
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden" 
                />
              </label>
            </div>

            <h3 className="text-xl font-bold text-white tracking-wide">{profileUser.name}</h3>
            <span className="text-xs text-[#00BFFF] font-bold uppercase tracking-widest mt-1 block">
              {profileUser.role}
            </span>
            
            <div className="w-full border-t border-gray-850 mt-4 pt-4 flex flex-col gap-2 text-left text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="truncate">{profileUser.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#00BFFF] shrink-0" />
                <span className="truncate">{profileUser.teamRole || 'No designated team role'}</span>
              </span>
            </div>
          </div>

          {/* Team Role Details Card */}
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
            <h3 className="font-extrabold text-white text-sm tracking-wide uppercase border-b border-gray-850 pb-2">
              Squad Affiliation
            </h3>
            {profileTeam ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: profileTeam.color || '#00BFFF' }}></span>
                  <span className="text-white font-extrabold text-sm">{profileTeam.name}</span>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed bg-[#1A1A1A] p-3 rounded-lg border border-gray-850">
                  <div className="mb-1 text-[11px] font-semibold text-gray-500 uppercase">Team Role Info:</div>
                  {profileUser.teamRole ? (
                    <span className="text-[#00BFFF] font-bold text-xs">{profileUser.teamRole}</span>
                  ) : (
                    <span className="italic text-gray-500">Add role title in details (e.g. Lead Designer)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Currently unassigned to any active squad. Admins can assign you on their dashboard.
              </div>
            )}
          </div>

          {/* Badges Container */}
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
            <h3 className="font-extrabold text-white text-sm tracking-wide uppercase border-b border-gray-850 pb-2 flex items-center gap-1.5">
              <Award className="h-5 w-5 text-purple-400" />
              Accomplishments
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(BADGE_INFO).map((badgeName) => {
                const earned = profileUser.badges?.some(b => b.name === badgeName);
                const config = BADGE_INFO[badgeName];
                const Icon = config.icon;

                return (
                  <div 
                    key={badgeName} 
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-2 group relative transition-all duration-300 ${
                      earned 
                        ? config.color 
                        : 'border-gray-850/60 bg-[#121212] opacity-40 hover:opacity-50'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-[10px] font-bold leading-tight">{badgeName}</span>

                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 bg-[#1A1A1A] text-gray-300 text-[10px] p-2.5 rounded-lg border border-gray-850 shadow-xl z-10 pointer-events-none">
                      <div className="font-bold text-white mb-0.5">{badgeName}</div>
                      <div>{config.description}</div>
                      {!earned && <div className="text-red-400 mt-1 font-semibold">Locked 🔒</div>}
                      {earned && <div className="text-green-400 mt-1 font-semibold">Earned! 🎉</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Editable Fields Form */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-xl border border-gray-850">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-850 pb-3 flex items-center gap-2">
            Edit Profile Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-sm">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            {/* Team Role Input (visible to modify, admins can also update this) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Role Title</label>
              <input
                type="text"
                placeholder="e.g. Lead Developer, Graphic Specialist, Pen Tester"
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Short Bio</label>
              <textarea
                placeholder="Share your interests, skills, or club squad contributions..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-28 resize-none"
              ></textarea>
            </div>

            {/* Skills Tag Tool */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Skills & Expertise</label>
              
              <div className="flex flex-wrap gap-2 mb-3 bg-[#1A1A1A] p-3 rounded-lg border border-gray-850 min-h-[50px]">
                {skills.length === 0 && <span className="text-gray-500 text-xs italic">No skills listed yet. Add skills below!</span>}
                {skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1 bg-[#00BFFF]/10 text-[#00BFFF] border border-[#00BFFF]/20 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold"
                  >
                    <span>{skill}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSkill(skill)}
                      className="p-0.5 rounded-full hover:bg-[#00BFFF]/20 text-[#00BFFF]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, Cyber Sec, Web3"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#00BFFF]"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-lg font-bold border border-gray-800 transition-all flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-850 pb-1">
                Social Link Directory
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* LinkedIn */}
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="LinkedIn URL"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                {/* GitHub */}
                <div className="relative">
                  <GitMerge className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="GitHub URL"
                    value={socialLinks.github}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                {/* Instagram */}
                <div className="relative">
                  <Camera className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Instagram URL"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-extrabold px-6 py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
