"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('adminToken');
      const url = new URL(`${API_URL}/api/admin/registrations`);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [search]);

  return (
    <div>
        <header className="bg-[var(--surface)] p-4 border-b border-[var(--border)] flex justify-between items-center mb-4">
           <h1 className="font-bold">Registrations</h1>
           <Link href="/" className="text-sm text-[var(--accent)] font-medium">Back to Queue</Link>
        </header>

        <div className="p-4 space-y-4">
            <input 
              type="search" 
              placeholder="Search name, phone, case number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
            />
            
            {loading ? <p>Loading...</p> : (
                <div className="space-y-3">
                    {registrations.map(reg => (
                        <div key={reg._id} className="bg-[var(--surface)] p-4 rounded-lg shadow-sm border border-[var(--border)]">
                            <p className="font-bold">{reg.name || 'Old Case'}</p>
                            <p className="text-sm text-[var(--ink-muted)]">Phone: {reg.phoneNumber}</p>
                            {reg.caseNumber && <p className="text-sm text-[var(--ink-muted)]">Case: {reg.caseNumber}</p>}
                            <div className="mt-2 flex gap-2">
                               <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{reg.status}</span>
                               <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{reg.caseType}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
