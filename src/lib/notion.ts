'use server';

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getTransactions = async (databaseId: string) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response.results;
  } catch (error) {
    console.error('Error fetching transactions from Notion:', error);
    // In a real app, you might want to handle this more gracefully
    return [];
  }
};

export const addTransaction = async (databaseId: string, properties: any) => {
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
};
