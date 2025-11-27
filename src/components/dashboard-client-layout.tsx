'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTransactionSheet } from './add-transaction-sheet';

export function DashboardClientLayout({
  children,
  accounts = [],
}: {
  children: React.ReactNode;
  accounts?: any[];
}) {
  return (
    <DashboardLayout
      title="Dashboard"
      headerActions={<AddTransactionSheet accounts={accounts} />}
    >
      {children}
    </DashboardLayout>
  );
}
