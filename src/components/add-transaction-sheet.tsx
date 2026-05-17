'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddTransactionForm } from './add-transaction-form';
import { AddTransferForm } from './add-transfer-form';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AddTransactionSheet({ accounts = [] }: { accounts?: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle />
          Transaction
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add a New Movement</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new transaction or transfer to your Notion database.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="transaction" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transaction">Income / Expense</TabsTrigger>
            <TabsTrigger value="transfer">Transfer / FX</TabsTrigger>
          </TabsList>
          <TabsContent value="transaction">
            <AddTransactionForm afterSubmit={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="transfer">
            <AddTransferForm afterSubmit={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
