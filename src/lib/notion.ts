'use server';

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { getProperty } from './utils';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

export const findUserByUsernameOrEmail = async (loginIdentifier: string) => {
  const authDbId = process.env.NOTION_AUTH_DB;
  if (!authDbId) {
    throw new Error('Notion Auth DB ID is not configured.');
  }

  try {
    let filter;
    if (isEmail(loginIdentifier)) {
      filter = {
        property: 'Email',
        email: {
          equals: loginIdentifier,
        },
      };
    } else {
      filter = {
        property: 'Username',
        rich_text: {
          equals: loginIdentifier,
        },
      };
    }

    const response = await notion.databases.query({
      database_id: authDbId,
      filter: filter,
    });

    if (response.results.length > 0) {
      const userPage = response.results[0] as any;
      return {
        id: userPage.id,
        username: getProperty(userPage.properties.Username),
        email: getProperty(userPage.properties.Email),
        password: getProperty(userPage.properties.Password),
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user in Notion:', error);
    throw new Error('Could not connect to the user database.');
  }
};

export const createUser = async (userData: {email: string, username: string, password: string})=> {
    const authDbId = process.env.NOTION_AUTH_DB;
    if (!authDbId) {
        throw new Error('Notion Auth DB ID is not configured.');
    }

    try {
        const newUser = await notion.pages.create({
            parent: { database_id: authDbId },
            properties: {
                Username: { rich_text: [{ text: { content: userData.username } }] },
                Email: { email: userData.email },
                Password: { rich_text: [{ text: { content: userData.password } }] },
            },
        });
        return newUser;
    } catch (error) {
        console.error('Error creating user in Notion:', error);
        throw new Error('Could not create user account.');
    }
}

export const getTransactions = async (databaseId: string) => {
  try {
    if (!databaseId) {
      // Return empty array if DB ID is not set, to avoid crashing
      return [];
    }
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
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
  return response;
};

export const updatePage = async (pageId: string, properties: any) => {
  await notion.pages.update({
    page_id: pageId,
    properties,
  });
};

export const deletePage = async (pageId: string) => {
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
