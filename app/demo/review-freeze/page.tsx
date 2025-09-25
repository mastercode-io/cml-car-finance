import { Suspense } from 'react';

import { ReviewFreezeDemoForm } from '@/src/demo/ReviewFreezeDemo';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Review Freeze Flow Demo',
  description: 'Keyboard-first flow demonstrating the review navigation freeze policy.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ReviewFreezeDemoPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="container mx-auto max-w-3xl space-y-8 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Review Freeze Demo</h1>
          <p className="text-sm text-muted-foreground">
            Use only the keyboard to progress and verify that the review step remains active.
          </p>
        </div>

        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading review demo…</div>}>
          <ReviewFreezeDemoForm />
        </Suspense>
      </div>
      <Toaster richColors position="top-right" />
    </main>
  );
}
