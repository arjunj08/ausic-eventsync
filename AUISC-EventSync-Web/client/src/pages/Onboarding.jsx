import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  User, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Loader2, 
  Camera, 
  ShieldCheck 
} from 'lucide-react';

const SKILLS_LIST = [
  'Design', 'Development', 'Marketing', 'Content Writing',
  'Photography', 'Video Editing', 'Public Speaking',
  'Event Management', 'Finance', 'Social Media'
];

export default function Onboarding() {
  const { user, refreshUser } = useContext(AuthContext);
  
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1st');
  const [department, setDepartment] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [suggestedTeam, setSuggestedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manage skill tag select/deselect
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  // Upload avatar in onboarding
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      await axios.post('/api/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save profile picture.');
    } finally {
      setLoading(false);
    }
  };

  // Submit onboarding details to complete it
  const handleCompleteOnboarding = async () => {
    if (!department.trim()) {
      setErrorMsg('Please specify your department.');
      return;
    }
    if (selectedSkills.length === 0) {
      setErrorMsg('Please select at least one skill.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.patch('/api/users/onboarding/complete', {
        bio,
        yearOfStudy,
        department,
        skills: selectedSkills
      });

      setSuggestedTeam(res.data.team);
      setStep(4); // Show confirmation slide
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save onboarding details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    await refreshUser();
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex items-center justify-center p-4">
      {/* Spotlight neon gradient in background */}
      <div className="absolute h-96 w-96 rounded-full bg-[#00BFFF]/5 blur-3xl top-1/4 left-1/4 pointer-events-none"></div>
      <div className="absolute h-96 w-96 rounded-full bg-[#8F5CFF]/5 blur-3xl bottom-1/4 right-1/4 pointer-events-none"></div>

      <div className="bg-[#111111] border border-gray-850 max-w-lg w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[480px] justify-between">
        
        {/* Progress indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {[1, 2, 3, 4].map(idx => (
            <div 
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= idx ? 'bg-[#00BFFF]' : 'bg-gray-800'
              }`}
            ></div>
          ))}
        </div>

        {/* Dynamic Slide Content */}
        <div className="flex-1 flex flex-col justify-center">
          
          {step === 1 && (
            <div className="text-center space-y-4 py-6">
              <span className="text-5xl block animate-bounce">👋</span>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Welcome to <span className="text-[#00BFFF]">AUISC EventSync</span>
              </h2>
              <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Let's configure your profile preferences so that coordinators can align tasks to your skillset.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-[#00BFFF]" />
                Profile Setup
              </h3>

              {/* Avatar Selector */}
              <div className="flex items-center gap-4 bg-[#161616] p-4 rounded-xl border border-gray-850">
                <div className="relative group shrink-0">
                  <img 
                    src={avatarPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt="avatar"
                    className="h-16 w-16 rounded-full border border-purple-500 object-cover bg-purple-500"
                  />
                  <label 
                    htmlFor="onboarding-avatar"
                    className="absolute inset-0 bg-[#000000ab] rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input 
                      type="file" 
                      id="onboarding-avatar" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </label>
                </div>
                <div>
                  <span className="text-white text-sm font-semibold block">Upload profile photo</span>
                  <span className="text-xs text-gray-500 block mt-0.5">JPG, PNG or SVG. Max 2MB.</span>
                </div>
              </div>

              {/* Bio description */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Short Bio</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BFFF] h-20 resize-none"
                ></textarea>
              </div>

              {/* Grid: Year + Dept */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF] cursor-pointer"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, IT, ECE"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BFFF]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Select Skills & Interests
              </h3>
              <p className="text-xs text-gray-400">Choose your expertise to help auto-allocate your squad team.</p>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-1">
                {SKILLS_LIST.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        selected 
                          ? 'bg-[#00BFFF]/10 border-[#00BFFF] text-[#00BFFF]' 
                          : 'bg-[#1A1A1A] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && suggestedTeam && (
            <div className="text-center space-y-4 py-6">
              <span className="text-5xl block">🎉</span>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Squad Allocated!
              </h2>
              <p className="text-sm text-gray-450 max-w-xs mx-auto">
                Based on your skills selection, you have been assigned to:
              </p>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/5">
                <span className="h-4.5 w-4.5 rounded-full" style={{ backgroundColor: suggestedTeam.color || '#00BFFF' }}></span>
                <span className="text-white font-extrabold text-sm uppercase tracking-wider">{suggestedTeam.name}</span>
              </div>

              <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-2">
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>Onboarding completed! Welcome aboard.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-gray-850 pt-5 mt-6 shrink-0">
          <div className="text-xs text-gray-550">
            {step !== 4 && <span>Step {step} of 3</span>}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-black px-5 py-3 rounded-lg text-sm transition-all flex items-center gap-1"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!department.trim()}
                className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-black px-5 py-3 rounded-lg text-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading || selectedSkills.length === 0}
                className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-black px-5 py-3 rounded-lg text-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Allocating Team...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <span>Join Club Workspace</span>
                  </>
                )}
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleFinish}
                className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-black px-6 py-3 rounded-lg text-sm transition-all flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                <span>Enter EventSync</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
