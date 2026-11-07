export const PASSGATE_CONFIG = {
  url: 'https://advance-admin.lovable.app',
  key: 'pgk_live_qMS4Y8HdnyYvayl0CNPgu63dabpdipWH',
};

export interface PassGateVerifyResponse {
  valid: boolean;
  token?: string;
  reason?: string;
}

export interface PassGateSessionResponse {
  valid: boolean;
}

async function callPassGate<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(PASSGATE_CONFIG.url + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': PASSGATE_CONFIG.key,
    },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export async function verifyPassGatePassword(password: string): Promise<{ success: boolean; message: string; token?: string }> {
  try {
    const res = await callPassGate<PassGateVerifyResponse>('/api/public/v1/verify', { password });
    if (res.valid && res.token) {
      localStorage.setItem('pg_token', res.token);
      return { success: true, message: '', token: res.token };
    }
    if (res.reason === 'rate_limited') {
      return { success: false, message: 'Too many attempts. Try later.' };
    }
    if (res.reason === 'ip_blocked') {
      return { success: false, message: 'Access from your network is blocked.' };
    }
    if (res.reason === 'origin_not_allowed') {
      return { success: false, message: 'This site is not allowed for this key.' };
    }
    if (res.reason === 'invalid_api_key') {
      return { success: false, message: 'API key is wrong or revoked.' };
    }
    return { success: false, message: 'Wrong password' };
  } catch {
    return { success: false, message: 'Cannot reach the PassGate server. Is the app published?' };
  }
}

export async function checkPassGateSession(): Promise<boolean> {
  const token = localStorage.getItem('pg_token');
  if (!token) return false;
  try {
    const res = await callPassGate<PassGateSessionResponse>('/api/public/v1/session', { token });
    if (res.valid) {
      return true;
    }
    localStorage.removeItem('pg_token');
    return false;
  } catch {
    return false;
  }
}

export function logoutPassGate(): void {
  localStorage.removeItem('pg_token');
}
