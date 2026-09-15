import { Role } from '../types';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  initial: string;
}

export function getUserInitial(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/[a-zA-Z0-9]/);
  return match ? match[0].toUpperCase() : trimmed.charAt(0).toUpperCase();
}

export function getAuthenticatedUser(): AuthenticatedUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('scc_token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload || !payload.id) return null;

    if (payload.exp && typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('scc_token');
      localStorage.removeItem('scc_role');
      localStorage.removeItem('scc_user_name');
      return null;
    }

    const name = payload.name || localStorage.getItem('scc_user_name') || '';
    const role = (payload.role || localStorage.getItem('scc_role')) as Role;
    const initial = getUserInitial(name);

    return {
      id: payload.id,
      name,
      email: payload.email || '',
      role,
      departmentId: payload.departmentId,
      initial,
    };
  } catch (err) {
    return null;
  }
}

export function dispatchAuthChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scc_auth_change'));
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('scc_role');
    localStorage.removeItem('scc_user_name');
    localStorage.removeItem('scc_token');
    dispatchAuthChange();
    window.location.href = '/';
  }
}
