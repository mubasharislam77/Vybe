'use client';

import { useRouter } from 'next/navigation';
import { TextField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

export function TrackOrderForm() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderNumber = String(formData.get('orderNumber') ?? '').trim();
    const token = String(formData.get('token') ?? '').trim();
    if (!orderNumber || !token) return;
    router.push(`/track-order/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField name="orderNumber" label="Order number" required placeholder="VYB-20250101-ABCDEF" />
      <TextField name="token" label="Tracking link code" required hint="From your order confirmation page or link." />
      <Button type="submit" variant="primary" size="md">
        Track Order
      </Button>
    </form>
  );
}
