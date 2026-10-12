'use client';

import { useState } from 'react';
import { changeMyPassword } from '@/lib/actions/admin/auth.actions';
import { TextField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const result = await changeMyPassword({ currentPassword, newPassword, confirmPassword });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not change password.');
      return;
    }
    setSuccess('Password changed.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <TextField label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
      <TextField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" hint="Min 8 chars, a letter and a number" />
      <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
      <FormMessage error={error} success={success} />
      <div>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : 'Change password'}
        </Button>
      </div>
    </form>
  );
}
