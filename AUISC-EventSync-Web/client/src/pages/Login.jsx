import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, Shield, User, Loader2, Key, ChevronRight, X } from 'lucide-react';

export default function Login() {
  const { login, register, landingRole, setLandingRole, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock Google Authentication states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, landingRole);
      } else {
        const res = await login(email, password);
        if (res && res.twoFactorRequired) {
          navigate('/otp-verify', { state: { email, mockOtp: res.otp } });
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail, presetPassword, role) => {
    setError('');
    setLoading(true);
    setLandingRole(role);
    try {
      const res = await login(presetEmail, presetPassword);
      if (res && res.twoFactorRequired) {
        navigate('/otp-verify', { state: { email: presetEmail, mockOtp: res.otp } });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center px-6 py-12">
      <div className="max-w-md w-full bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl p-8 overflow-hidden relative">
        
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00BFFF] to-transparent"></div>

        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-[#00BFFF]/10 border border-[#00BFFF]/20 items-center justify-center text-[#00BFFF] mb-3">
            <Zap className="h-6 w-6 fill-[#00BFFF]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">AUISC EventSync</h2>
          <p className="text-gray-400 text-sm">Manage events, teams & collaboration</p>
        </div>

        {/* Role Selector Toggle */}
        <div className="flex bg-[#161616] p-1 rounded-lg border border-gray-850 mb-6">
          <button
            type="button"
            onClick={() => setLandingRole('member')}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              landingRole === 'member'
                ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF]'
                : 'text-gray-400 border border-transparent hover:text-white'
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Member
          </button>
          <button
            type="button"
            onClick={() => setLandingRole('admin')}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              landingRole === 'admin'
                ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF]'
                : 'text-gray-400 border border-transparent hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </button>
        </div>

        {/* Role Description Card */}
        <div className="bg-[#1a1a1a] border border-gray-850 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[#7C3AED] flex-shrink-0">
            {landingRole === 'admin' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">
              {landingRole === 'admin' ? 'Administrative Access' : 'Club Member Access'}
            </h4>
            <p className="text-xs text-gray-400 leading-normal">
              {landingRole === 'admin' 
                ? 'Authorized credentials allow creation of events, task assignment, expense review, and report downloading.'
                : 'Collaborate with your squad, update tasks, submit event receipts, and participate in WebRTC video calls.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl p-3 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                placeholder="Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              placeholder="member1@auisc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 text-black font-bold rounded-lg text-sm transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              isRegister ? `Register as ${landingRole === 'admin' ? 'Admin' : 'Member'}` : `Enter as ${landingRole === 'admin' ? 'Admin' : 'Member'}`
            )}
          </button>

          {/* OR Divider */}
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-850"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-gray-850"></div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full h-11 bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 hover:border-gray-700 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.38c0,-0.74 -0.07,-1.45 -0.21,-2.1" fill="#4285F4" />
              <path d="M12,20.7c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.91,0.61 -2.07,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.92v2.66c1.49,2.96 4.54,4.83 8.08,4.83" fill="#34A853" />
              <path d="M6.96,13.21a5.81,5.81 0 0 1 0,-3.42V7.13H2.92a9.92,9.92 0 0 0 0,8.74l4.04,-2.66" fill="#FBBC05" />
              <path d="M12,7.3c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,4.68 14.42,3.9 12,3.9c-3.54,0 -6.59,1.87 -8.08,4.83l4.04,2.66c0.71,-2.13 2.7,-3.71 5.04,-3.71" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </form>

        {/* Mock Google OAuth Popup */}
        {showGoogleModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
              {/* Header */}
              <div className="p-5 border-b border-gray-850 flex items-center justify-between bg-[#161616]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.38c0,-0.74 -0.07,-1.45 -0.21,-2.1" fill="#4285F4" />
                    <path d="M12,20.7c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.91,0.61 -2.07,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.92v2.66c1.49,2.96 4.54,4.83 8.08,4.83" fill="#34A853" />
                    <path d="M6.96,13.21a5.81,5.81 0 0 1 0,-3.42V7.13H2.92a9.92,9.92 0 0 0 0,8.74l4.04,-2.66" fill="#FBBC05" />
                    <path d="M12,7.3c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,4.68 14.42,3.9 12,3.9c-3.54,0 -6.59,1.87 -8.08,4.83l4.04,2.66c0.71,-2.13 2.7,-3.71 5.04,-3.71" fill="#EA4335" />
                  </svg>
                  <h3 className="font-extrabold text-white text-sm">Choose Google Account</h3>
                </div>
                <button 
                  onClick={() => setShowGoogleModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Choose account list */}
              <div className="p-6 space-y-4">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-left">Recent Google Sign-ins</span>
                
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setShowGoogleModal(false);
                        await loginWithGoogle('Sarah Chen', 'member1@auisc.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
                      } catch (err) {
                        setError(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] border border-gray-850 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
                        alt="Sarah" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="block text-xs font-bold text-white">Sarah Chen</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5">member1@auisc.com</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setShowGoogleModal(false);
                        await loginWithGoogle('Admin User', 'admin@auisc.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
                      } catch (err) {
                        setError(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] border border-gray-850 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" 
                        alt="Admin" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="block text-xs font-bold text-white">Admin User</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5">admin@auisc.com</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Or sign in with a new Google Account */}
                <div className="border-t border-gray-850 pt-4 mt-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-left mb-3">Sign in with a new Google Account</span>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!googleEmail.trim() || !googleName.trim()) return;
                      try {
                        setLoading(true);
                        setShowGoogleModal(false);
                        await loginWithGoogle(googleName.trim(), googleEmail.toLowerCase().trim(), `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName)}&backgroundColor=7c3aed`);
                      } catch (err) {
                        setError(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      className="w-full bg-[#161616] text-white placeholder-gray-600 border border-gray-850 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-xs"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Google Email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full bg-[#161616] text-white placeholder-gray-600 border border-gray-850 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full h-9 bg-white hover:bg-gray-200 text-black font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Select Account
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Toggle between register & login */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#00BFFF] hover:underline transition-all cursor-pointer font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Quick presets (highly convenient for sandbox testing) */}
        {!isRegister && (
          <div className="mt-8 border-t border-gray-850 pt-6">
            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center mb-3">Quick Presets</h5>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('member1@auisc.com', 'password123', 'member')}
                className="bg-[#161616] hover:bg-[#202020] border border-gray-850 hover:border-gray-800 rounded-xl p-2.5 text-left transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">Sarah Chen</span>
                <span className="block text-[9px] text-[#00BFFF] mt-0.5">Quick Member Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@auisc.com', 'password123', 'admin')}
                className="bg-[#161616] hover:bg-[#202020] border border-gray-850 hover:border-gray-800 rounded-xl p-2.5 text-left transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">Admin User</span>
                <span className="block text-[9px] text-[#7C3AED] mt-0.5">Quick Admin Login</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
