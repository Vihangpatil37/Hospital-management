export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export async function login(pin: string) {
    const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
}

export async function getLiveQueue() {
    const res = await fetch(`${API_URL}/api/admin/queue/live`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('adminToken');
            window.location.reload();
        }
        const err = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch queue: ${res.status} - ${err}`);
    }
    return res.json();
}

export async function updateTokenAction(tokenId: string, action: 'call-next' | 'skip' | 'complete') {
    const res = await fetch(`${API_URL}/api/admin/queue/${tokenId}/${action}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Action ${action} failed`);
    return res.json();
}
