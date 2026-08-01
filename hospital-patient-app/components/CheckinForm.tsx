"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRegistration } from '../lib/api';

export default function CheckinForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phoneNumber') as string;

    try {
      // Just verify the registration exists for this window before redirecting
      await getRegistration(phoneNumber);
      // If successful, redirect to token screen to actually perform the location check-in
      router.push(`/token?phone=${phoneNumber}`);
    } catch (err: any) {
      setError(err.message || 'No active registration found for this number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
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
          placeholder="10-digit registered number" 
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-6">
        {loading ? 'Checking in...' : 'Get My Token'}
      </button>
    </form>
  );
}
