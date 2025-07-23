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
    
    // In Notion, all amounts might be stored as positive values.
    // We determine if it's income or expense based on other properties if available,
    // or assume expense for now if not specified.
    // Let's assume positive is income, negative is expense from how it's entered.
    const type = amount >= 0 ? 'Income' : 'Expense';

    return {
      id: page.id,
      date: getProperty(props.Date) || new Date().toISOString().split('T')[0],
      description: getProperty(props.Source) || 'N/A', // Changed from Description to Source
      amount: amount,
      type: type,
      category: getProperty(props.Tags) || 'Other', // Changed from Category to Tags
    };
  });
};
