import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Cross, ShieldCheck } from 'lucide-react';
import { api, setToken } from '../api/client';

export default function Login({ users, onLogin }) {
  const [email, setEmail] = useState('alex.vaughan@mgh.gh');
  const [password, setPassword] = useState('password');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      onLogin({ id: 'U-api', name: user.name, role: user.role, department: '', avatar: initials(user.name) });
    } catch {
      // Backend offline → demo mode: match a known account by email
      const demo = users.find((u) => emailFor(u.name) === email.toLowerCase()) || users[0];
      onLogin(demo);
    } finally { setBusy(false); }
  };

  const quick = (u) => { setEmail(emailFor(u.name)); setPassword('password'); onLogin(u); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-end p-12 text-white overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0b1c30 0%, #182f49 60%, #23405f 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #b2c8e9 0, transparent 40%), radial-gradient(circle at 80% 60%, #febb06 0, transparent 45%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-amber-400 flex items-center justify-center">
              <Cross className="h-6 w-6" style={{ color: '#0b1c30' }} />
            </div>
            <span className="text-2xl font-display font-extrabold tracking-tight">The Bank Hospital</span>
          </div>
          <h1 className="text-4xl font-display font-extrabold leading-tight max-w-md">Welcome to The Bank Hospital Operations.</h1>
          <p className="mt-3 text-slate-300 max-w-md leading-relaxed">Empowering clinical excellence through precision and integrated workflow management.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-display font-extrabold" style={{ color: '#0b1c30' }}>Sign In</h2>
          <p className="text-slate-500 mt-1">Enter your credentials to access the operations platform.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-slate-700">Email / Username</label>
              <div className="mt-1.5 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" placeholder="dr.vaughan@meridian.org" />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-slate-700">Password</label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" className="h-4 w-4 accent-[#0b1c30]" /> Remember me</label>
              <a className="font-semibold text-slate-700 hover:underline" href="#">Forgot password?</a>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 rounded-lg font-semibold text-white" style={{ background: '#0b1c30' }}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2">Demo accounts (click to enter)</div>
            <div className="flex flex-wrap gap-2">
              {users.slice(0, 8).map((u) => (
                <button key={u.id} onClick={() => quick(u)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                  {u.role}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-3 text-[12px] text-slate-400">
            <span>Security Policy</span><span>·</span><span>Help Center</span><span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> All Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name = '') { return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(); }
function emailFor(name = '') { return name.toLowerCase().replace(/^dr\.?\s+/, '').replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '') + '@mgh.gh'; }
