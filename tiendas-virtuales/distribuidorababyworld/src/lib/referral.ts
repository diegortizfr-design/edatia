const STORAGE_KEY = 'bw_aliado_ref_v1';
const TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 días de atribución

interface StoredReferral {
  code: string;
  expiresAt: number;
}

export function captureReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('ref') || params.get('aliado') || '').trim().toUpperCase();
    if (!raw || !/^[A-Z0-9_-]{3,32}$/.test(raw)) {
      return getActiveReferralCode();
    }
    const payload: StoredReferral = {
      code: raw,
      expiresAt: Date.now() + TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return raw;
  } catch {
    return null;
  }
}

export function getActiveReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredReferral = JSON.parse(raw);
    if (!parsed?.code || !parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function appendRefToWhatsAppMessage(message: string): string {
  const ref = getActiveReferralCode();
  if (!ref) return message;
  return `${message}\n\n[Ref: ${ref}]`;
}

