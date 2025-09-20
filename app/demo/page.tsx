import { Suspense } from 'react';

import { DemoForm } from '@/src/demo/DemoForm';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Form Builder Demo',
  description: 'Interactive demo form showcasing the schema driven engine.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="container mx-auto max-w-5xl space-y-10 px-4">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading demo…</div>}>
          <DemoForm />
        </Suspense>
      </div>
      <Toaster richColors position="top-right" />
    </main>
  );
}
