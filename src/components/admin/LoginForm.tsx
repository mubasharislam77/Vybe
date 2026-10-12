'use client';

import { useActionState, useState } from 'react';
import { staffLogin, type StaffLoginState } from '@/lib/actions/admin/auth.actions';
import { TextField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from './FormMessage';

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<StaffLoginState, FormData>(staffLogin, {});
  // React 19 resets uncontrolled form fields after a server action settles;
  // keep the email so a mistyped password doesn't also wipe the address.
  const [email, setEmail] = useState('');

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <TextField label="Email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormMessage error={state.errorMessage} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
