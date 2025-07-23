'use server';

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

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
            filter: {
                property: 'Is Active',
                checkbox: {
                    equals: true,
                },
            },
        });
        return response.results;
    } catch (error) {
        console.error(`Error fetching accounts from Notion DB ${databaseId}:`, error);
        return [];
    }
};

export const getAllTransactions = async (expenseDbId: string, incomeDbId: string) => {
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
    const dateA = new Date((a as any).properties.Date.date.start);
    const dateB = new Date((b as any).properties.Date.date.start);
    return dateB.getTime() - dateA.getTime();
  });

  return allTransactions;
};

export const addTransaction = async (databaseId: string, properties: any) => {
  if (!databaseId) {
    throw new Error('Database ID is undefined');
  }
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
};

export const updateTransaction = async (pageId: string, properties: any) => {
  await notion.pages.update({
    page_id: pageId,
    properties,
  });
};

export const deleteTransaction = async (pageId: string) => {
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
