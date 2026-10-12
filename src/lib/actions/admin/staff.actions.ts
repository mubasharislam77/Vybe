'use server';

import { revalidatePath } from 'next/cache';
import { staffCreateSchema, staffPasswordResetSchema, staffUpdateSchema } from '@/lib/validation/admin';
import { createStaff, resetStaffPassword, updateStaff } from '@/lib/services/staff.service';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

export async function createStaffAccount(rawInput: unknown): Promise<AdminActionResult<{ id: string }>> {
  return runAdminAction('admin', async (actor) => {
    const parsed = staffCreateSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const created = await createStaff(parsed.data);
    await audit(actor, 'staff.created', 'staff', created._id.toString(), { email: created.email, role: created.role });
    revalidatePath('/admin/staff');
    return ok({ id: created._id.toString() });
  });
}

export async function updateStaffAccount(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const parsed = staffUpdateSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const updated = await updateStaff(parsed.data, actor.id);
    await audit(actor, 'staff.updated', 'staff', updated._id.toString(), {
      email: updated.email,
      role: updated.role,
      active: updated.active,
    });
    revalidatePath('/admin/staff');
    return ok();
  });
}

export async function resetStaffAccountPassword(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const parsed = staffPasswordResetSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    await resetStaffPassword(parsed.data.id, parsed.data.password);
    await audit(actor, 'staff.password_reset', 'staff', parsed.data.id);
    revalidatePath('/admin/staff');
    return ok();
  });
}
