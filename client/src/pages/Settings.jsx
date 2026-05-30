import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Bell, 
  Mail, 
  Sparkles, 
  Lock, 
  Trash2, 
  Check, 
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useContext(AuthContext);

  // 2FA Setup states
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [twoFactorSetupCode, setTwoFactorSetupCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorStatusMsg, setTwoFactorStatusMsg] = useState('');
  const [twoFactorErrorMsg, setTwoFactorErrorMsg] = useState('');

  // Request 2FA setup OTP
  const handleRequest2fa = async () => {
    setTwoFactorLoading(true);
    setTwoFactorStatusMsg('');
    setTwoFactorErrorMsg('');
    try {
      await axios.post('/api/auth/request-2fa');
      setShow2faSetup(true);
      setTwoFactorStatusMsg('A setup code has been sent to your email.');
    } catch (err) {
      setTwoFactorErrorMsg(err.response?.data?.error || 'Failed to request 2FA setup code.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleConfirm2fa = async (e) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorStatusMsg('');
    setTwoFactorErrorMsg('');
    try {
      await axios.patch('/api/auth/enable-2fa', { code: twoFactorSetupCode });
      setTwoFactorStatusMsg('Two-Factor Authentication has been successfully enabled.');
      setShow2faSetup(false);
      setTwoFactorSetupCode('');
      refreshUser();
    } catch (err) {
      setTwoFactorErrorMsg(err.response?.data?.error || 'Invalid or expired setup code.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2fa = async () => {
    setTwoFactorLoading(true);
    setTwoFactorStatusMsg('');
    setTwoFactorErrorMsg('');
    try {
      await axios.patch('/api/auth/disable-2fa');
      setTwoFactorStatusMsg('Two-Factor Authentication has been disabled.');
      refreshUser();
    } catch (err) {
      setTwoFactorErrorMsg(err.response?.data?.error || 'Failed to disable 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Toggle states
  const [notificationSound, setNotificationSound] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [aiPersona, setAiPersona] = useState('helpful');
  const [huddleVolume, setHuddleVolume] = useState(70);

  // Email Alerts states
  const [taskAssigned, setTaskAssigned] = useState(true);
  const [meetingScheduled, setMeetingScheduled] = useState(true);
  const [expenseUpdate, setExpenseUpdate] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Action loading
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Clear chat confirm
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Fetch current user settings
  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/profile/me');
      const settings = res.data.user.settings || { notificationSound: true, emailAlerts: true, aiPersona: 'helpful' };
      setNotificationSound(settings.notificationSound);
      setEmailAlerts(settings.emailAlerts);
      setAiPersona(settings.aiPersona);

      const emailNotifs = res.data.user.emailNotifications || { taskAssigned: true, meetingScheduled: true, expenseUpdate: true, weeklyDigest: true };
      setTaskAssigned(emailNotifs.taskAssigned);
      setMeetingScheduled(emailNotifs.meetingScheduled);
      setExpenseUpdate(emailNotifs.expenseUpdate);
      setWeeklyDigest(emailNotifs.weeklyDigest);

      // Fetch volume from localStorage if saved
      const savedVolume = localStorage.getItem('huddle_volume');
      if (savedVolume !== null) {
        setHuddleVolume(Number(savedVolume));
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save general settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await axios.patch('/api/profile/settings/me', {
        notificationSound,
        emailAlerts,
        aiPersona,
        emailNotifications: {
          taskAssigned,
          meetingScheduled,
          expenseUpdate,
          weeklyDigest
        }
      });

      // Save huddle volume in localStorage
      localStorage.setItem('huddle_volume', huddleVolume);

      setSuccessMsg('App settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshUser();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        oldPassword,
        newPassword
      });

      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  // Clear workspace chat history (Admin only)
  const handleClearChatHistory = async () => {
    try {
      await axios.delete('/api/chat/messages/clear');
      setShowClearConfirm(false);
      alert('Workspace chat history has been cleared.');
    } catch (err) {
      console.error(err);
      alert('Failed to clear chat history.');
    }
  };

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-4xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">APP</span> SETTINGS
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure notifications, coordination sounds, password updates, and system cleanups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: General preferences & sounds */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-850 pb-3 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[#00BFFF]" />
              General Preferences
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-sm flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Notification Toggles */}
              <div className="space-y-4">
                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-purple-400 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">Notification Sounds</span>
                      <span className="text-xs text-gray-400">Play tone on chat messages and huddle alerts.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSound}
                      onChange={(e) => setNotificationSound(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>

                {/* Email alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#00BFFF] mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-white block">Email Announcements</span>
                      <span className="text-xs text-gray-400">Send digests of published events to email inbox.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>
              </div>

              {/* Email Notification Toggles */}
              <div className="space-y-4 border-t border-gray-850 pt-6">
                <h3 className="text-sm font-semibold text-[#00BFFF] uppercase tracking-wider mb-3">Email Alerts Subscriptions</h3>
                
                {/* Task Assigned */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Task Assignments</span>
                    <span className="text-[11px] text-gray-400">Receive an email when new coordinate tasks are assigned.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={taskAssigned}
                      onChange={(e) => setTaskAssigned(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>

                {/* Meeting Scheduled */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Meeting Schedules</span>
                    <span className="text-[11px] text-gray-400">Receive email invitations and agendas for club briefs.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={meetingScheduled}
                      onChange={(e) => setMeetingScheduled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>

                {/* Expense Update */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Expense Slips Updates</span>
                    <span className="text-[11px] text-gray-400">Receive emails when your budget claims are approved/rejected.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={expenseUpdate}
                      onChange={(e) => setExpenseUpdate(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>

                {/* Weekly Digest */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Monday Morning Weekly Summary</span>
                    <span className="text-[11px] text-gray-400">Receive a weekly overview of pending tasks and events.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  </label>
                </div>
              </div>

              {/* Huddle Volume Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <Volume2 className="h-4.5 w-4.5 text-[#00BFFF]" />
                    Huddle Calls Volume
                  </span>
                  <span className="text-xs text-[#00BFFF] font-bold">{huddleVolume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={huddleVolume}
                  onChange={(e) => setHuddleVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00BFFF]"
                />
              </div>

              {/* AI Persona selection */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                  <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                  Chatbot Persona Context
                </span>
                <select
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                >
                  <option value="helpful">Helpful (Detailed summaries, friendly alerts)</option>
                  <option value="technical">Technical (Raw code/schema fields focused, direct)</option>
                  <option value="direct">Direct (Short answers, high-density bullet lists)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-extrabold px-5 py-3 rounded-lg transition-all flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                <span>Save App Settings</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Security & system tools */}
        <div className="space-y-6">
          {/* Security (Change password) */}
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-850 pb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-400" />
              Security Setup
            </h2>

            {/* Two-Factor Authentication (2FA) */}
            <div className="mb-6 border-b border-gray-850 pb-6">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-[#00BFFF]" />
                Two-Factor Authentication
              </h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">
                Add an extra layer of security by requiring a 6-digit email OTP verification code at login.
              </p>

              {twoFactorStatusMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs mb-3">
                  {twoFactorStatusMsg}
                </div>
              )}

              {twoFactorErrorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs mb-3">
                  {twoFactorErrorMsg}
                </div>
              )}

              {user?.twoFactorEnabled ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    2FA Security Enabled
                  </div>
                  <button
                    onClick={handleDisable2fa}
                    disabled={twoFactorLoading}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {twoFactorLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Disable 2FA Security
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!show2faSetup ? (
                    <button
                      onClick={handleRequest2fa}
                      disabled={twoFactorLoading}
                      className="w-full bg-[#00BFFF]/10 hover:bg-[#00BFFF] text-[#00BFFF] hover:text-black border border-[#00BFFF]/20 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {twoFactorLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Enable 2FA Security
                    </button>
                  ) : (
                    <form onSubmit={handleConfirm2fa} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Enter Setup Code</label>
                        <input
                          type="text"
                          placeholder="6-digit OTP code"
                          value={twoFactorSetupCode}
                          onChange={(e) => setTwoFactorSetupCode(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF]"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={twoFactorLoading}
                          className="flex-1 bg-[#00BFFF] hover:bg-[#00D4FF] text-black py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {twoFactorLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />}
                          Confirm Code
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShow2faSetup(false);
                            setTwoFactorSetupCode('');
                          }}
                          className="bg-[#2A2A2A] hover:bg-gray-750 text-gray-300 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                {passLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* Admin Cleanups */}
          {user.role === 'admin' && (
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-gray-850 pb-3 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Club Maintenance
              </h2>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Clean and delete legacy chat logs to release database storage. This operation is irreversible.
              </p>

              {showClearConfirm ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
                  <div className="text-xs text-red-400 font-bold">Are you absolutely sure?</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearChatHistory}
                      className="bg-red-650 hover:bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all"
                    >
                      Yes, Clear Logs
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="bg-[#2A2A2A] hover:bg-gray-750 text-gray-300 text-[11px] font-semibold px-3 py-1.5 rounded transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Chat History</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
