'use server';

import { Client } from '@notionhq/client';

export const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

export const getTransactions = async (databaseId: string) => {
    const response = await notion.databases.query({
        database_id: databaseId,
    });
    return response.results;
};

export const addTransaction = async (databaseId: string, properties: any) => {
    await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
    });
};
