'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AddTransactionSheet } from './add-transaction-sheet';

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
       <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
         <AddTransactionSheet />
      </header>
      {children}
    </DashboardLayout>
  );
}
