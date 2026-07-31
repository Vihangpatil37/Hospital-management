"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getRegistration, API_URL } from '@/lib/api';
import { getGeolocation, watchGeolocation } from '@/lib/geolocation';
import { socket } from '@/lib/socket';
import { MapPin, AlertCircle } from 'lucide-react';

function TokenScreenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneNumber = searchParams.get('phone');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  
  const [registration, setRegistration] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!phoneNumber) {
      router.push('/');
      return;
    }

    const init = async () => {
      try {
        const reg = await getRegistration(phoneNumber);
        setRegistration(reg.registration);
        
        // Initial Check-in
        const coords = await getGeolocation();
        const res = await fetch(`${API_URL}/api/queue/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationId: reg.registration._id, lat: coords.lat, lng: coords.lng })
        });

        if (res.status === 409) {
            const data = await res.json();
            setError(`You are ${data.distance}m away. Please move closer to the hospital (within 70m).`);
            setDistance(data.distance);
            setLoading(false);
            return;
        }

        if (!res.ok) throw new Error('Failed to checkin');

        const checkinData = await res.json();
        
        // Fetch full token info to get queue position
        const tokenRes = await fetch(`${API_URL}/api/queue/token/${checkinData.token._id}`);
        const tokenData = await tokenRes.json();
        
        setTokenInfo(tokenData.token);
        setQueuePosition(tokenData.queuePosition);
        
        // Connect socket
        socket.connect();
        socket.emit('join:patient', { registrationId: reg.registration._id });
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Checkin failed. Make sure location is enabled.');
        setLoading(false);
      }
    };

    init();

    return () => {
        socket.disconnect();
    };
  }, [phoneNumber, router]);

  useEffect(() => {
      if (!tokenInfo) return;

      const handleCalled = (data: any) => {
          if (data.tokenNumber === tokenInfo.tokenNumber) {
              setTokenInfo((prev: any) => ({ ...prev, status: 'called' }));
              setPulse(true);
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
              setTimeout(() => setPulse(false), 3000);
          }
      };

      const handleUpdate = (data: any) => {
         setQueuePosition(data.queuePosition);
      };

      const handleCancelled = () => {
         setTokenInfo((prev: any) => ({ ...prev, status: 'cancelled' }));
      };

      socket.on('token:called', handleCalled);
      socket.on('token:position-update', handleUpdate);
      socket.on('token:cancelled', handleCancelled);

      // Start pinging geolocation
      let watchId: number;
      const startWatching = () => {
          watchId = watchGeolocation(
              async (coords) => {
                  try {
                      const res = await fetch(`${API_URL}/api/queue/ping`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tokenId: tokenInfo._id, lat: coords.lat, lng: coords.lng })
                      });
                      const data = await res.json();
                      if (data.status) {
                         setTokenInfo((prev: any) => ({ ...prev, status: data.status }));
                      }
                      if (data.distance) setDistance(data.distance);
                  } catch (e) {
                      console.error('Ping failed', e);
                  }
              },
              (err) => console.error('Location watch error', err)
          );
      };

      startWatching();

      return () => {
          socket.off('token:called', handleCalled);
          socket.off('token:position-update', handleUpdate);
          socket.off('token:cancelled', handleCancelled);
          if (watchId) navigator.geolocation.clearWatch(watchId);
      };
  }, [tokenInfo?._id]);

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-64 text-[var(--ink-muted)]">Checking location...</div>;
  }

  if (error && !tokenInfo) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--danger)]" />
        <h2 className="text-xl font-bold">Check-in Failed</h2>
        <p className="text-[var(--ink-muted)]">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  if (!tokenInfo) return null;

  return (
    <div className="p-6 flex flex-col items-center justify-center h-screen space-y-8 bg-[var(--surface)]">
      
      <div className="text-center">
        <p className="text-[var(--ink-muted)] font-medium mb-2 uppercase tracking-wide text-sm">Your Token Number</p>
        <div className={`text-6xl font-bold font-mono py-8 px-12 bg-[var(--bg)] border border-[var(--border)] rounded-2xl ${pulse ? 'animate-pulse text-[var(--accent)] border-[var(--accent)]' : ''}`}>
          {tokenInfo.tokenNumber.toString().padStart(3, '0')}
        </div>
      </div>

      <div className="w-full space-y-3 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
         <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
            <span className="text-[var(--ink-muted)]">Queue Position</span>
            <span className="font-bold text-xl">{queuePosition !== null ? queuePosition : '--'}</span>
         </div>
         <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
            <span className="text-[var(--ink-muted)]">Status</span>
            <span className={`font-semibold capitalize ${tokenInfo.status === 'grace_period' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {tokenInfo.status.replace('_', ' ')}
            </span>
         </div>
         <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--ink-muted)] flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Distance
            </span>
            <span className="font-medium">{distance ? `${Math.round(distance)}m` : 'Measuring...'}</span>
         </div>
      </div>

      {tokenInfo.status === 'grace_period' && (
        <div className="w-full p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
          You are outside the hospital zone. Return within the grace period or your token will be cancelled.
        </div>
      )}

      {tokenInfo.status === 'called' && (
        <div className="w-full p-4 bg-[var(--accent)] text-white rounded-lg text-center font-bold text-lg animate-bounce">
          Please proceed to the doctor's room!
        </div>
      )}
    </div>
  );
}

export default function TokenPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <TokenScreenContent />
    </Suspense>
  );
}
