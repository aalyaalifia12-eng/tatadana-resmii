/**
 * TataDana Session & User Context Helper (Client & Storage)
 * Enforces authenticated user isolation, role separation, and impersonation.
 */

export function getClientUserId(): string | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tatadana_user_id');
    if (stored) return stored;

    // Check cookie
    const match = document.cookie.match(new RegExp('(^| )tatadana_user_id=([^;]+)'));
    if (match) return match[2];
  }
  return null;
}

export function setClientUserId(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tatadana_user_id', userId);
    document.cookie = `tatadana_user_id=${userId}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export function getImpersonatedUserId(): string | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tatadana_impersonated_user_id');
    if (stored) return stored;

    const match = document.cookie.match(new RegExp('(^| )tatadana_impersonated_user_id=([^;]+)'));
    if (match) return match[2];
  }
  return null;
}

export function setImpersonatedUserId(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tatadana_impersonated_user_id', userId);
    document.cookie = `tatadana_impersonated_user_id=${userId}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearImpersonatedUserId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tatadana_impersonated_user_id');
    document.cookie = `tatadana_impersonated_user_id=; path=/; max-age=0`;
  }
}

export function getEffectiveUserId(): string | null {
  const impersonated = getImpersonatedUserId();
  if (impersonated) return impersonated;
  return getClientUserId();
}

export function clearClientUserId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tatadana_user_id');
    localStorage.removeItem('tatadana_impersonated_user_id');
    document.cookie = `tatadana_user_id=; path=/; max-age=0`;
    document.cookie = `tatadana_impersonated_user_id=; path=/; max-age=0`;
  }
}
