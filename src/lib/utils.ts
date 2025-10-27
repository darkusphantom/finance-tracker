import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';

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
    };
  });
};

export const transformDebtData = (notionPages: any[]): any[] => {
  if (!notionPages) return [];
  return notionPages.map(page => {
    const props = (page as any).properties;
    return {
      id: page.id,
      name: getProperty(props.Title) || 'N/A',
      type: getProperty(props.Type) === 'Deuda' ? 'Debt' : 'Debtor',
      total: getProperty(props['Debt Amount']) || 0,
      paid: getProperty(props['Amount Paid']) || 0,
      status: getProperty(props.Status) || 'Pendiente',
      reason: getProperty(props.Reason) || '',
      date: getProperty(props.Date) || new Date().toISOString().split('T')[0],
    };
  });
};


export const transformTransactionData = (notionPages: any[]): any[] => {
  return notionPages.map(page => {
    const props = (page as any).properties;
    const amount = getProperty(props.Amount) || 0;

    // The type is now passed with the page object from getAllTransactions
    const type = (page as any).type;

    return {
      id: page.id,
      date: getProperty(props.Date) || new Date().toISOString().split('T')[0],
      description: getProperty(props.Source) || 'N/A',
      amount: amount,
      type: type, // 'income' or 'expense'
      category: getProperty(props.Tags) || 'Other',
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
    };
  });
};

export const calculateFinancialSummary = (transactions: any[], year: number) => {
  const yearTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return getYear(date) === year;
  });

  const annualTotalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const annualTotalExpenses = Math.abs(
    yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  
  const annualNet = annualTotalIncome - annualTotalExpenses;

  // Annual Summary for chart
  const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

  const annualChartData = months.map(month => {
    const monthTransactions = yearTransactions.filter(t => {
      const date = new Date(t.date);
      return getMonth(date) === month;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(
      monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
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
