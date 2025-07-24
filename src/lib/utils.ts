import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to safely extract properties from Notion's complex object
const getProperty = (prop: any) => {
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

        // If status is "Listo" (Done), the paid amount is the total amount.
        // Otherwise, we assume 0 is paid for simplicity. This can be adjusted
        // if a "Paid Amount" property is added to Notion.
        const paid = status === 'Listo' ? total : 0;
        
        return {
            id: page.id,
            name: getProperty(props.Title) || 'N/A',
            type: type === 'Deuda' ? 'Debt' : 'Debtor',
            total: total,
            paid: paid,
            status: status || 'Pending',
        };
    });
}

export const transformTransactionData = (
  notionPages: any[]
): any[] => {
  return notionPages.map(page => {
    const props = (page as any).properties;
    const amount = getProperty(props.Amount) || 0;
    
    // The type is now passed with the page object from getAllTransactions
    const type = (page as any).type;
    
    // For display purposes, expenses are shown as negative, income as positive
    const displayAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    return {
      id: page.id,
      date: getProperty(props.Date) || new Date().toISOString().split('T')[0],
      description: getProperty(props.Source) || 'N/A',
      amount: displayAmount,
      type: type, // 'income' or 'expense'
      category: getProperty(props.Tags) || 'Other',
    };
  });
};
