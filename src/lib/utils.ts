import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, getMonth, getYear, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to safely extract properties from Notion's complex object
export const getProperty = (prop: any) => {
  if (!prop) return null;
  switch (prop.type) {
    case 'title':
      return prop.title[0]?.plain_text;
    case 'rich_text':
      return prop.rich_text[0]?.plain_text;
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name;
    case 'date':
      return prop.date?.start;
    case 'checkbox':
      return prop.checkbox;
    case 'email':
      return prop.email;
    case 'formula':
      return prop.formula?.number ?? prop.formula?.string ?? prop.formula?.boolean ?? null;
    case 'rollup':
      return prop.rollup?.number ?? prop.rollup?.date?.start ?? prop.rollup?.array ?? null;
    default:
      return null;
  }
};

export const transformAccountData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;
    return {
      id: page.id,
      name: getProperty(props.Name) || 'N/A',
      type: getProperty(props['Account Type']) || 'Other',
      balance: getProperty(props['Balance Amount']) || 0,
      isActive: getProperty(props['Is Active']) || false,
      currency: getProperty(props.Currency) || 'USD',
      accountNumber: getProperty(props['Account Number']) || null,
      lastTransactionDate: getProperty(props['Last Transaction Date']) || null,
    };
  });
};

export const transformDebtData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;
    const total = getProperty(props['Debt Amount']) || 0;
    const status = getProperty(props.Status);
    const type = getProperty(props.Type);
    const paid = getProperty(props['Amount Paid']) || 0;

    return {
      id: page.id,
      name: getProperty(props.Title) || 'N/A',
      type: type === 'Deuda' ? 'Debt' : 'Debtor',
      total: total,
      paid: paid,
      status: status || 'Pending',
      saldoPendiente: getProperty(props['⚖️ Saldo Pendiente']) || 0,
      estadoDeuda: getProperty(props['Estado Deuda']) || '⚪ Sin datos',
      reason: getProperty(props.Reason) || '',
      date: getProperty(props.Date) || null,
    };
  });
};

// Extracts only the YYYY-MM-DD portion from a date string that may include
// a full ISO datetime with timezone (e.g. "2026-05-01T08:02:00.000-04:00")
const parseDateOnly = (dateStr: string | null): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // If it contains a 'T', it's a full datetime — slice off just the date part
  return dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr;
};

export const transformTransactionData = (notionPages: any[]): any[] => {
  return notionPages.map(page => {
    const props = (page as any).properties;
    const amount = getProperty(props.Amount) || 0;

    // The type is now passed with the page object from getAllTransactions
    const type = (page as any).type;

    // Try both formula field names: income DB uses '💵 Real USD Income',
    // expenses DB uses '💸 Real USD Expense'
    const incomeFormula = Object.entries(props).find(
      ([key]) => key.includes('Real USD Income')
    );
    const expenseFormula = Object.entries(props).find(
      ([key]) => key.includes('Real USD Expense')
    );
    const formulaEntry = incomeFormula ?? expenseFormula;
    const realUsdAmount =
      formulaEntry
        ? (formulaEntry[1] as any)?.formula?.number ?? null
        : null;

    return {
      id: page.id,
      date: parseDateOnly(getProperty(props.Date)),
      description: getProperty(props.Source) || 'N/A',
      amount: amount,
      type: type, // 'income' or 'expense'
      category: getProperty(props.Tags) || 'Other',
      currency: getProperty(props.Currency) || 'USD',
      exchangeRate: getProperty(props['Exchange Rate Used']) ?? null,
      realUsdAmount,
      /** Bank commission charged on this expense (Banco de Venezuela / Banco Provincial). Null if no commission was applied. */
      commission: getProperty(props['Comission']) ?? null,
      accountId: props.Account?.relation?.[0]?.id || null,
    };
  });
};

export const transformScheduledPaymentsData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;
    const category = getProperty(props.Category);
    const type = getProperty(props.Type);

    return {
      id: page.id,
      name: getProperty(props.Name) || 'N/A',
      day: getProperty(props['Month Day']) || 1,
      amount: getProperty(props['Budget Amount']) || 0,
      type: type === 'Fijo' ? 'fixed' : 'variable',
      category: category === 'Ingreso' ? 'income' : 'expense',
      isActive: getProperty(props.IsActive) ?? true,
    };
  });
};

export const transformWishlistData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;

    return {
      id: page.id,
      name: getProperty(props.Name) || 'N/A',
      price: getProperty(props.Price) || 0,
      priorityLevel: getProperty(props['Priority Level']) || '0',
      storeLocation: getProperty(props['Store Location']) || '',
      itemCategory: getProperty(props['Item Category']) || 'Other',
      purchaseDate: getProperty(props['Purchase Date']) || null,
      isPurchased: getProperty(props['Is Purchased']) || false,
      supplierContact: getProperty(props['Supplier Contact']) || '',
      discard: getProperty(props.Discard) || false,
      itemImage: props['Item Image']?.files?.[0]?.file?.url || props['Item Image']?.files?.[0]?.external?.url || null,
    };
  });
};

export const transformMonthlySavingsData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;

    // Rollup fields (sum of real USD values from related records)
    const totalIncome: number = props['Total Monthly Income']?.rollup?.number ?? 0;
    const totalExpenses: number = props['Total Monthly Expenses']?.rollup?.number ?? 0;

    // Formula fields (pre-formatted strings from Notion, useful as fallback)
    const netFormula: number = props['Monthly Net']?.formula?.number ?? (totalIncome - totalExpenses);

    return {
      id: page.id,
      name: getProperty(props.Name) || 'Unknown Month',
      monthNumber: props['Month Number']?.number ?? 0,
      totalIncome,
      totalExpenses,
      net: netFormula,
    };
  });
};

export const calculateFinancialSummary = (transactions: any[], year: number) => {
  // Use parseISO so 'YYYY-MM-DD' is treated as local midnight, not UTC midnight.
  // new Date('2026-01-01') is UTC midnight → in UTC-4 that's Dec 31 at 20:00 local,
  // which breaks month/year grouping. parseISO('2026-01-01') = Jan 1 local midnight.
  const yearTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return getYear(date) === year;
  });

  // Prefer realUsdAmount (Notion formula) so amounts are always in USD.
  // Fall back to raw amount only for records without a formula result (USD transactions).
  const usd = (t: any) => t.realUsdAmount ?? t.amount;

  const annualTotalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + usd(t), 0);

  const annualTotalExpenses = Math.abs(
    yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + usd(t), 0)
  );

  const annualNet = annualTotalIncome - annualTotalExpenses;

  // Monthly breakdown for the bar chart (only months with data)
  const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

  const annualChartData = months.map(month => {
    const monthTransactions = yearTransactions.filter(t => {
      const date = parseISO(t.date);
      return getMonth(date) === month;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + usd(t), 0);

    const expenses = Math.abs(
      monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + usd(t), 0)
    );

    const net = income - expenses;

    return {
      month: format(new Date(year, month), 'MMM'),
      income,
      expenses,
      net,
    };
  });

  return {
    annualTotalIncome,
    annualTotalExpenses,
    annualNet,
    annualChartData,
  };
};