'use server';

import { Client } from '@notionhq/client';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

async function getNotionClient() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    const token = session.notionToken;
    if (!token) {
        // This case should be handled by middleware, but as a safeguard:
        throw new Error('Notion token is not configured for this user.');
    }
    return new Client({ auth: token });
}


export const getTransactions = async (databaseId: string) => {
  try {
    if (!databaseId) {
      // Return empty array if DB ID is not set, to avoid crashing
      return [];
    }
    const notion = await getNotionClient();
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response.results;
  } catch (error) {
    console.error(`Error fetching transactions from Notion DB ${databaseId}:`, error);
    return [];
  }
};

export const getAccounts = async (databaseId: string) => {
    try {
        if (!databaseId) {
            console.warn('Accounts Database ID is not defined.');
            return [];
        }
        const notion = await getNotionClient();
        const response = await notion.databases.query({
            database_id: databaseId,
        });
        return response.results;
    } catch (error) {
        console.error(`Error fetching accounts from Notion DB ${databaseId}:`, error);
        return [];
    }
};

export const getDebts = async (databaseId: string) => {
  try {
    if (!databaseId) {
      console.warn('Debts Database ID is not defined.');
      return [];
    }
    const notion = await getNotionClient();
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response.results;
  } catch (error) {
    console.error(`Error fetching debts from Notion DB ${databaseId}:`, error);
    return [];
  }
}

export const getScheduledPayments = async (databaseId: string) => {
  try {
    if (!databaseId) {
      console.warn('Budget Database ID is not defined.');
      return [];
    }
    const notion = await getNotionClient();
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response.results;
  } catch (error) {
    console.error(`Error fetching scheduled payments from Notion DB ${databaseId}:`, error);
    return [];
  }
};


export const getAllTransactions = async (expenseDbId: string, incomeDbId: string) => {
  if (!expenseDbId && !incomeDbId) {
    return [];
  }
  
  const [expenseTransactions, incomeTransactions] = await Promise.all([
    getTransactions(expenseDbId),
    getTransactions(incomeDbId)
  ]);

  const allTransactions = [
    ...expenseTransactions.map(t => ({ ...t, type: 'expense' })),
    ...incomeTransactions.map(t => ({ ...t, type: 'income' })),
  ];
  
  // Sort by date, most recent first
  allTransactions.sort((a, b) => {
    const dateA = new Date((a as any).properties.Date?.date?.start || 0);
    const dateB = new Date((b as any).properties.Date?.date?.start || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return allTransactions;
};

export const addPageToDb = async (databaseId: string, properties: any) => {
  if (!databaseId) {
    throw new Error('Database ID is undefined');
  }
  const notion = await getNotionClient();
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
  return response;
};

export const updatePage = async (pageId: string, properties: any) => {
  const notion = await getNotionClient();
  await notion.pages.update({
    page_id: pageId,
    properties,
  });
};

export const deletePage = async (pageId: string) => {
  const notion = await getNotionClient();
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
};

export const findOrCreateMonthPage = async (
  databaseId: string,
  monthName: string
): Promise<string> => {
  if (!databaseId) {
    throw new Error('Total Savings Database ID is undefined');
  }
  const notion = await getNotionClient();
  // 1. Search for the month page
  const searchResponse = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      title: {
        equals: monthName,
      },
    },
  });

  if (searchResponse.results.length > 0) {
    // 2. If it exists, return the ID
    return searchResponse.results[0].id;
  } else {
    // 3. If it doesn't exist, create it and return the new ID
    const newPage = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: monthName,
              },
            },
          ],
        },
      },
    });
    return newPage.id;
  }
};
