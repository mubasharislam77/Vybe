'use client';

import { useState } from 'react';
import Reveal from './ui/Reveal';
import { subscribe } from '@/lib/api';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await subscribe(email);
      setState(res.ok ? 'success' : 'error');
      setMessage(res.message);
      if (res.ok) setEmail('');
    } catch {
      setState('error');
      setMessage('Network error — is the API running?');
    }
  }

  return (
    <section className="relative overflow-hidden bg-vybe px-6 py-24 text-ink-950 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="font-display text-4xl leading-none md:text-6xl">
            Get early access.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-lg text-base text-ink-950/70">
            Drop 01 is limited. Join the list for first dibs, secret prices, and the
            occasional desi meme. No spam — that&apos;s not the vibe.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 border border-ink-950/30 bg-transparent px-5 py-4 text-ink-950 placeholder:text-ink-950/40 focus:border-ink-950 focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="bg-ink-950 px-8 py-4 font-display text-sm uppercase tracking-widest text-vybe transition-transform hover:scale-[1.03] disabled:opacity-60"
            >
              {state === 'loading' ? 'Joining…' : 'Join'}
            </button>
          </form>
        </Reveal>

        {state === 'success' && (
          <p className="mt-4 font-semibold text-ink-950">✓ {message}</p>
        )}
        {state === 'error' && (
          <p className="mt-4 font-semibold text-vybe-hot">{message}</p>
        )}
      </div>
    </section>
  );
}
