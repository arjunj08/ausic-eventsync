import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Key, Loader2, ChevronLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OTPVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const email = location.state?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!email) {
      toast.error('No email context found. Redirecting to login.');
      navigate('/login');
      return;
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  // Countdown timer for code resends
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1); // Get last typed character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace handles going back
    if (e.key === 'Backspace' && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length !== 6 || isNaN(Number(pasteData))) {
      toast.error('Please paste a valid 6-digit number');
      return;
    }

    const pastedDigits = pasteData.split('');
    setCode(pastedDigits);
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/verify-otp', { email, code: fullCode });
      toast.success('Verification successful!');
      await refreshUser(); // Fetch authenticated profile and login
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit automatically when all 6 digits are filled
  useEffect(() => {
    if (code.every(digit => digit !== '')) {
      handleSubmit();
    }
  }, [code]);

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post('/api/auth/resend-otp', { email });
      toast.success('New verification code sent to your email.');
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center px-6 py-12">
      <div className="max-w-md w-full bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl p-8 relative">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00BFFF] to-transparent"></div>

        {/* Back Link */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Login
        </button>

        {/* Header */}
        <div className="text-center mt-6 mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-[#00BFFF]/10 border border-[#00BFFF]/20 items-center justify-center text-[#00BFFF] mb-3">
            <Key className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Two-Factor OTP</h2>
          <p className="text-gray-400 text-sm">We've sent a 6-digit verification code to</p>
          <p className="text-[#00BFFF] text-sm font-semibold truncate mt-1">{email}</p>
        </div>

        {/* Digits Grid */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-[#161616] text-white border border-gray-800 rounded-xl focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]/30 outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 text-black font-extrabold rounded-lg text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : (
              'Verify & Authenticate'
            )}
          </button>
        </form>

        {/* Resend Actions */}
        <div className="text-center mt-6">
          {resendTimer > 0 ? (
            <p className="text-xs text-gray-400">
              Resend code in <span className="text-[#00BFFF] font-semibold">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs text-[#00BFFF] hover:underline transition-all cursor-pointer font-bold inline-flex items-center gap-1"
            >
              {resending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Resend Verification Code'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
