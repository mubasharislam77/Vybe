'use client';

import { useState } from 'react';
import { submitReview } from '@/lib/actions/review.actions';
import { TextField, TextAreaField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    const result = await submitReview({
      productId,
      customerName: formData.get('customerName'),
      rating,
      title: formData.get('title') || undefined,
      body: formData.get('body'),
    });

    if (result.success) {
      setStatus('done');
      e.currentTarget.reset();
      setRating(5);
    } else {
      setStatus('error');
      setErrorMessage(result.errorMessage ?? 'Something went wrong.');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="text-sm text-ink-600">
        Thanks — your review is submitted and will appear once approved.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              onClick={() => setRating(n)}
              className={`flex h-11 w-11 items-center justify-center text-xl ${n <= rating ? 'text-lime' : 'text-ink/20'}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <TextField name="customerName" label="Your name" required maxLength={60} />
      <TextField name="title" label="Review title (optional)" maxLength={100} />
      <TextAreaField name="body" label="Your review" required minLength={10} maxLength={2000} />
      {errorMessage && (
        <p role="alert" className="text-sm text-burgundy">
          {errorMessage}
        </p>
      )}
      <Button type="submit" variant="primary" size="md" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting…' : 'Submit Review'}
      </Button>
    </form>
  );
}
