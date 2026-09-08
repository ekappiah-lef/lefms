import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api, setToken } from '../api/client';
import lefLogo from '../assets/whitelogo.png';
import loginBg from '../assets/backgroundlogin.jpg';

export default function Login({ onLogin, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { token, user } = await api.auth.login(email.trim(), password);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Check the API is running.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-primary bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <form onSubmit={submit} className="relative z-10 flex flex-col items-center px-6 w-full">
        <img src={lefLogo} alt="LEF" className="h-16 w-auto object-contain mb-8" />

        {(error || notice) && (
          <div className={`w-full max-w-[300px] flex items-start gap-2 rounded-lg border text-sm px-3 py-2.5 mb-4 ${error ? 'bg-red-500/20 border-red-300/40 text-red-50' : 'bg-white/15 border-white/30 text-white'}`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error || notice}</span>
          </div>
        )}

        <div className="w-full max-w-[300px] space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <input
              value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required autoFocus
              className="w-full pl-10 pr-3 py-3 text-sm rounded-md bg-transparent border-[1.5px] border-white/70 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <input
              value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="Password" required
              className="w-full pl-10 pr-10 py-3 text-sm rounded-md bg-transparent border-[1.5px] border-white/70 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={busy}
          className="w-full max-w-[300px] mt-6 rounded-md bg-white hover:bg-white/90 disabled:opacity-60 text-primary font-bold text-sm tracking-wide py-3
            transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          {busy ? 'SIGNING IN…' : 'LOGIN'}
        </button>

        <div className="w-full max-w-[300px] text-right mt-3">
          <span className="text-[13px] text-white/90">Forgot password?</span>
        </div>
      </form>
    </div>
  );
}
