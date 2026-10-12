import { requireStaffSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/repositories/audit.repo';

export interface AdminActionResult<T = undefined> {
  success: boolean;
  errorMessage?: string;
  data?: T;
}

export type StaffActor = Awaited<ReturnType<typeof requireStaffSession>>;

/** Who did what, to which record — every mutating admin action records one of these. */
export async function audit(
  actor: StaffActor,
  action: string,
  targetType: string,
  targetId: string,
  diff?: Record<string, unknown>,
): Promise<void> {
  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email ?? actor.name,
    action,
    targetType,
    targetId,
    diff,
  });
}

export function fail<T = undefined>(errorMessage: string): AdminActionResult<T> {
  return { success: false, errorMessage };
}

export function ok<T = undefined>(data?: T): AdminActionResult<T> {
  return { success: true, data };
}

/**
 * Uniform wrapper: authorizes (throwing UnauthorizedError if not staff /
 * not admin where required), runs the body, and turns known error types
 * into a friendly `errorMessage` instead of a thrown 500. Unknown errors
 * still throw so they surface in logs.
 */
export async function runAdminAction<T = undefined>(
  minRole: 'staff' | 'admin',
  body: (actor: StaffActor) => Promise<AdminActionResult<T>>,
): Promise<AdminActionResult<T>> {
  const actor = await requireStaffSession(minRole);
  try {
    return await body(actor);
  } catch (err) {
    if (err instanceof Error && FRIENDLY_ERRORS.some((name) => err.constructor.name === name)) {
      return fail<T>(err.message);
    }
    throw err;
  }
}

const FRIENDLY_ERRORS = [
  'InvalidTransitionError',
  'InvalidPaymentTransitionError',
  'ProductSaveError',
  'StaffManagementError',
  'CatalogError',
];

export function firstIssue(error: { issues: { message: string; path: PropertyKey[] }[] }): string {
  const issue = error.issues[0];
  if (!issue) return 'Please check the form.';
  const path = issue.path.filter((p) => typeof p === 'string').join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}
