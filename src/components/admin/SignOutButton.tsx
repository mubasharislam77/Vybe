import { staffSignOut } from '@/lib/actions/admin/auth.actions';

export function SignOutButton() {
  return (
    <form action={staffSignOut}>
      <button
        type="submit"
        className="min-h-[36px] border border-ink/20 px-3 text-xs font-semibold uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
      >
        Sign out
      </button>
    </form>
  );
}
