'use server';

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

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
    return [];
  }
};

export const addTransaction = async (databaseId: string, properties: any) => {
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
