export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function registerPatient(data: any) {
  const res = await fetch(`${API_URL}/api/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to register');
  }

  return res.json();
}

export async function getRegistration(phoneNumber: string) {
  const res = await fetch(`${API_URL}/api/registrations/me?phoneNumber=${encodeURIComponent(phoneNumber)}`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch registration');
  }

  return res.json();
}
