'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStaffAccount, resetStaffAccountPassword, updateStaffAccount } from '@/lib/actions/admin/staff.actions';
import { TextField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';
import { inputClass, smallButtonClass } from '../styles';

export function CreateStaffForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const result = await createStaffAccount({ fullName, email, role, password });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not create account.');
      return;
    }
    setSuccess(`Account created for ${email}. Share the password with them securely; they can change it from "My account".`);
    setFullName('');
    setEmail('');
    setPassword('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
      <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}>
        <option value="staff">Staff (operations)</option>
        <option value="admin">Admin (full access)</option>
      </SelectField>
      <TextField label="Temporary password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required hint="Min 8 chars, a letter and a number" autoComplete="new-password" />
      <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
        <div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </div>
        <FormMessage error={error} success={success} />
      </div>
    </form>
  );
}

export function StaffRowEditor({
  staff,
  isSelf,
}: {
  staff: { id: string; fullName: string; email: string; role: 'admin' | 'staff'; active: boolean };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(staff.fullName);
  const [role, setRole] = useState<'admin' | 'staff'>(staff.role);
  const [active, setActive] = useState(staff.active);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await updateStaffAccount({ id: staff.id, fullName, role, active });
    setBusy(false);
    if (!result.success) {
      setMessage({ error: result.errorMessage });
      return;
    }
    setMessage({ success: 'Saved.' });
    router.refresh();
  }

  async function resetPassword() {
    if (!newPassword) return;
    if (!window.confirm(`Reset the password for ${staff.email}?`)) return;
    setBusy(true);
    setMessage(null);
    const result = await resetStaffAccountPassword({ id: staff.id, password: newPassword });
    setBusy(false);
    if (!result.success) {
      setMessage({ error: result.errorMessage });
      return;
    }
    setNewPassword('');
    setMessage({ success: 'Password reset.' });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_120px_auto]">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold uppercase tracking-widest2 text-ink-600">Name</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold uppercase tracking-widest2 text-ink-600">Role</span>
        <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')} className={inputClass} disabled={isSelf}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-ink" disabled={isSelf} />
        Active
      </label>
      <div className="flex items-end">
        <button type="button" onClick={save} disabled={busy} className={smallButtonClass}>
          {busy ? 'Working…' : 'Save'}
        </button>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-widest2 text-ink-600">New password</span>
          <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Set a new temporary password" autoComplete="new-password" />
        </label>
        <button type="button" onClick={resetPassword} disabled={busy || !newPassword} className={smallButtonClass}>
          Reset password
        </button>
      </div>
      {message && (
        <div className="sm:col-span-2 lg:col-span-4">
          <FormMessage error={message.error} success={message.success} />
        </div>
      )}
      {isSelf && <p className="text-xs text-ink-400 sm:col-span-2 lg:col-span-4">You can&apos;t change your own role or deactivate yourself.</p>}
    </div>
  );
}
