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
    default:
      return null;
  }
};

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
