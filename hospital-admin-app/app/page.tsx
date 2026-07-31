"use client";

import { useState, useEffect } from 'react';
import { login } from '../lib/api';
import QueueBoard from '../components/QueueBoard';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setAuthed(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(pin);
      localStorage.setItem('adminToken', res.token);
      setAuthed(true);
    } catch (err) {
      setError('Invalid PIN');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
           <h1 className="text-2xl font-bold text-center mb-6">Staff Login</h1>
           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
           <input 
             type="password" 
             value={pin}
             onChange={e => setPin(e.target.value)}
             placeholder="Enter PIN (1234)"
             className="input-field text-center tracking-widest text-lg"
           />
           <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
        <header className="bg-[var(--surface)] p-4 border-b border-[var(--border)] flex justify-between items-center">
           <h1 className="font-bold">Hospital Admin</h1>
           <button 
             onClick={() => { localStorage.removeItem('adminToken'); setAuthed(false); }}
             className="text-sm text-[var(--danger)] font-medium"
           >
             Logout
           </button>
        </header>
        <QueueBoard />
    </div>
  );
}
