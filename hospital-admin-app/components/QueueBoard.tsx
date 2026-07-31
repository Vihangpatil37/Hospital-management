"use client";

import { useEffect, useState } from 'react';
import { getLiveQueue, updateTokenAction } from '../lib/api';
import { socket } from '../lib/socket';

export default function QueueBoard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const data = await getLiveQueue();
      setQueue(data.queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    socket.connect();
    socket.emit('join:admin');

    const handleNewToken = (data: any) => {
        setQueue(prev => [...prev, data.token].sort((a,b) => a.tokenNumber - b.tokenNumber));
    };

    const handleUpdated = (data: { tokenId: string, status: string }) => {
        setQueue(prev => {
            const copy = prev.map(t => t._id === data.tokenId ? { ...t, status: data.status } : t);
            if (['cancelled'].includes(data.status)) {
                return copy.filter(t => t._id !== data.tokenId);
            }
            return copy;
        });
    };

    const handleCancelled = (data: { tokenId: string }) => {
        setQueue(prev => prev.filter(t => t._id !== data.tokenId));
    };

    socket.on('queue:new-token', handleNewToken);
    socket.on('queue:updated', handleUpdated);
    socket.on('queue:token-cancelled', handleCancelled);

    return () => {
        socket.off('queue:new-token', handleNewToken);
        socket.off('queue:updated', handleUpdated);
        socket.off('queue:token-cancelled', handleCancelled);
        socket.disconnect();
    };
  }, []);

  const handleAction = async (tokenId: string, action: 'call-next' | 'skip' | 'complete') => {
      try {
          await updateTokenAction(tokenId, action);
      } catch (err) {
          console.error(err);
          alert(`Failed to ${action}`);
      }
  };

  if (loading) return <div className="p-6">Loading queue...</div>;

  const getBorderColor = (status: string) => {
      switch(status) {
          case 'called': return 'border-l-[6px] border-l-blue-500';
          case 'in_consultation': return 'border-l-[6px] border-l-purple-500';
          case 'grace_period': return 'border-l-[6px] border-l-[var(--danger)]';
          case 'completed': return 'border-l-[6px] border-l-[var(--success)]';
          default: return 'border-l-[6px] border-l-[var(--accent)]';
      }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Live Queue</h2>
          <button onClick={() => handleAction('next', 'call-next')} className="btn-primary w-auto px-6 h-10 text-sm">
             Call Next
          </button>
      </div>

      {queue.length === 0 ? (
          <div className="text-center py-10 text-[var(--ink-muted)]">Queue is empty</div>
      ) : (
          <div className="space-y-3">
              {queue.map(token => (
                  <div key={token._id} className={`bg-[var(--surface)] p-4 rounded-lg shadow-sm border border-[var(--border)] ${getBorderColor(token.status)}`}>
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                              <span className="text-3xl font-bold font-mono min-w-[3rem]">{token.tokenNumber.toString().padStart(3,'0')}</span>
                              <div>
                                  <p className="font-semibold">{token.registrationId?.name || `Old Case ${token.registrationId?.caseNumber}`}</p>
                                  <p className="text-sm text-[var(--ink-muted)] capitalize">{token.status.replace('_', ' ')}</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                             {['active', 'grace_period'].includes(token.status) && (
                                <button onClick={() => handleAction(token._id, 'call-next')} className="btn-secondary h-8 px-3 text-xs w-auto">Call</button>
                             )}
                             {token.status === 'called' && (
                                <button onClick={() => handleAction(token._id, 'complete')} className="btn-success h-8 px-3 text-xs w-auto">Complete</button>
                             )}
                             {['active', 'grace_period', 'called'].includes(token.status) && (
                                <button onClick={() => handleAction(token._id, 'skip')} className="btn-danger h-8 px-3 text-xs w-auto">Skip</button>
                             )}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
