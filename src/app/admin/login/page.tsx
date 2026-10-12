import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Staff sign in' };

const PILLARS = [
  { label: 'Orders', detail: 'Confirm, ship, verify payments' },
  { label: 'Catalog', detail: 'Products, drops, coupons' },
  { label: 'Customers', detail: 'Reviews, alerts, history' },
];

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await auth();
  if (session?.user && (session.user.role === 'admin' || session.user.role === 'staff')) {
    redirect('/admin');
  }
  const { next } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Brand panel */}
      <section className="relative isolate flex flex-col justify-between overflow-hidden bg-ink px-6 py-6 text-ivory sm:px-10 lg:col-span-7 lg:min-h-screen lg:px-14 lg:py-10">
        {/* Oversized wordmark backdrop */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-4 bottom-[-0.18em] z-0 select-none font-display text-[42vw] leading-none text-ivory/[0.045] lg:text-[26vw]"
        >
          VYBE
        </span>
        {/* Lime glow + model cutout */}
        <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] top-[55%] z-0 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-lime/[0.07] blur-3xl lg:h-[560px] lg:w-[560px]" />
        <div className="pointer-events-none absolute bottom-0 right-[-6%] z-0 hidden h-[92%] w-[60%] sm:block lg:right-[-3%] lg:w-[50%]">
          <Image src="/hero2.png" alt="" fill priority sizes="(min-width: 1024px) 36vw, 60vw" className="object-contain object-bottom" />
        </div>

        <header className="relative z-10 flex items-center gap-3">
          <Image src="/vybe-logo.png" alt="VybeTheBrand" width={44} height={44} priority className="h-11 w-11" />
          <div className="leading-tight">
            <p className="font-display text-lg uppercase tracking-widest2">VybeTheBrand</p>
            <p className="text-[11px] uppercase tracking-widest2 text-lime">Staff portal</p>
          </div>
        </header>

        <div className="relative z-10 my-10 max-w-xl lg:my-0">
          <p className="mb-4 font-display text-xs uppercase tracking-widest2 text-lime">Back of house</p>
          <h1 className="font-display text-5xl uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
            Run the
            <br />
            store.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ivory/70 sm:text-base">
            Orders, catalog, customers and alerts, all in one place. Every change you make here is recorded in the audit log.
          </p>
        </div>

        <ul className="relative z-10 hidden gap-6 border-t border-ivory/10 pt-6 sm:flex lg:max-w-[52%]">
          {PILLARS.map((p) => (
            <li key={p.label} className="max-w-[12rem]">
              <p className="font-display text-sm uppercase tracking-widest2 text-ivory">{p.label}</p>
              <p className="mt-1 text-xs text-ivory/55">{p.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center bg-ivory px-6 py-12 sm:px-10 lg:col-span-5 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <p className="mb-2 font-display text-xs uppercase tracking-widest2 text-burgundy">Staff access only</p>
          <h2 className="font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">Sign in</h2>
          <p className="mt-2 text-sm text-ink-600">Use the account an admin created for you. Customer accounts don&apos;t work here.</p>

          <div className="mt-8 border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(23,23,23,0.35)] sm:p-8">
            <LoginForm next={next} />
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-ink-400">
            <Link href="/" className="underline underline-offset-4 hover:text-ink">
              ← Back to the storefront
            </Link>
            <span>Sign-ins are rate limited</span>
          </div>
        </div>
      </section>
    </div>
  );
}
