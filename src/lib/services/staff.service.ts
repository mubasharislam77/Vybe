import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  countActiveAdmins,
  createStaffUser,
  findStaffByEmailAnyStatus,
  findStaffById,
  updateStaffPassword,
  updateStaffUser,
} from '@/lib/repositories/staff.repo';
import type { StaffCreateInput, StaffUpdateInput } from '@/lib/validation/admin';
import type { StaffUser } from '@/types/domain';

export class StaffManagementError extends Error {}

export async function createStaff(input: StaffCreateInput): Promise<StaffUser> {
  const existing = await findStaffByEmailAnyStatus(input.email);
  if (existing) throw new StaffManagementError('A staff account with this email already exists.');
  const passwordHash = await hashPassword(input.password);
  return createStaffUser({ email: input.email, fullName: input.fullName, role: input.role, passwordHash });
}

/**
 * Guards against the two ways an admin could lock everyone out: demoting
 * or deactivating the last active admin, and doing either to themselves
 * (which would end their own session's authority mid-click).
 */
export async function updateStaff(input: StaffUpdateInput, actorId: string): Promise<StaffUser> {
  const target = await findStaffById(input.id);
  if (!target) throw new StaffManagementError('Staff account not found.');

  const losesAdmin = target.role === 'admin' && target.active && (input.role !== 'admin' || !input.active);
  if (losesAdmin) {
    if (target._id.toString() === actorId) {
      throw new StaffManagementError('You cannot remove your own admin access. Ask another admin to do it.');
    }
    const otherAdmins = await countActiveAdmins(target._id.toString());
    if (otherAdmins === 0) {
      throw new StaffManagementError('This is the only active admin — promote someone else first.');
    }
  }

  await updateStaffUser(input.id, { fullName: input.fullName, role: input.role, active: input.active });
  const updated = await findStaffById(input.id);
  if (!updated) throw new StaffManagementError('Staff account not found.');
  return updated;
}

export async function resetStaffPassword(id: string, newPassword: string): Promise<void> {
  const target = await findStaffById(id);
  if (!target) throw new StaffManagementError('Staff account not found.');
  await updateStaffPassword(id, await hashPassword(newPassword));
}

export async function changeOwnPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
  const me = await findStaffById(id);
  if (!me) throw new StaffManagementError('Account not found.');
  const ok = await verifyPassword(currentPassword, me.passwordHash);
  if (!ok) throw new StaffManagementError('Current password is incorrect.');
  await updateStaffPassword(id, await hashPassword(newPassword));
}
