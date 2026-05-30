import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Zap, Shield, User, Loader2, Key } from 'lucide-react';

export default function Login() {
  const { login, register, landingRole, setLandingRole } = useContext(AuthContext);
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, landingRole);
      } else {
        await login(email, password);
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
      await login(presetEmail, presetPassword);
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
        </form>

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
