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
    const type = getProperty(props.Type);

    return {
      id: page.id,
      date: getProperty(props.Date) || new Date().toISOString().split('T')[0],
      description: getProperty(props.Description) || 'N/A',
      amount: type === 'Income' ? Math.abs(amount) : -Math.abs(amount),
      type: type || 'expense',
      category: getProperty(props.Category) || 'Other',
    };
  });
};
