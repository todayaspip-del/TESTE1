import { Role } from '../types';

/**
 * Domains used for automatic role provisioning when a new account is created.
 * Default role is STUDENT for standard emails, INSTRUCTOR for instructor tags/domains,
 * and SUPER_ADMIN for vulcanadm.
 */
export function resolveRoleFromEmail(email: string): Role | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
    return null;
  }

  if (normalized.includes('@vulcanadm') || normalized.includes('@admin')) {
    return 'SUPER_ADMIN';
  }
  if (normalized.includes('@vulcaninst') || normalized.includes('@instrutor') || normalized.includes('instructor')) {
    return 'INSTRUCTOR';
  }
  return 'STUDENT';
}

export function isKnownDomain(email: string): boolean {
  return resolveRoleFromEmail(email) !== null;
}
