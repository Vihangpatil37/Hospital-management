"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerPatient } from '../lib/api';

interface RegistrationFormProps {
  caseType: 'new' | 'old';
}

export default function RegistrationForm({ caseType }: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await registerPatient({ ...data, caseType });
      // Redirect to token screen
      router.push(`/token?phone=${data.phoneNumber}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-green-700">Registration Successful!</h2>
        <p className="text-[var(--ink-muted)]">Redirecting to home page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {caseType === 'new' && (
        <>
          <div>
            <label className="label-text">Full Name</label>
            <input type="text" name="name" required className="input-field" placeholder="Patient Name" />
          </div>
          <div>
            <label className="label-text">Village Name</label>
            <input type="text" name="villageName" required className="input-field" placeholder="Village" />
          </div>
        </>
      )}

      {caseType === 'old' && (
        <div>
          <label className="label-text">Case Number</label>
          <input type="text" name="caseNumber" required className="input-field" placeholder="e.g. 12345" />
        </div>
      )}

      <div>
        <label className="label-text">Phone Number</label>
        <input 
          type="tel" 
          name="phoneNumber" 
          required 
          pattern="[0-9]{10}"
          title="10 digit phone number"
          className="input-field" 
          placeholder="10-digit number" 
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-6">
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
