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
import { useState } from 'react';

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle />
          Add Transaction
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add a New Transaction</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new transaction to your Notion
            database.
          </SheetDescription>
        </SheetHeader>
        <AddTransactionForm afterSubmit={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
