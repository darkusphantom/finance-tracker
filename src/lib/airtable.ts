'use server';

import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  throw new Error('Airtable API key or Base ID are not defined in the environment variables.');
}

const base = new Airtable({ apiKey }).base(baseId);

export const findUserByUsername = async (username: string) => {
  const tableId = process.env.AIRTABLE_USERS_TABLE_ID;
  if (!tableId) {
    throw new Error('Airtable Users Table ID is not defined.');
  }

  try {
    const records = await base(tableId)
      .select({
        maxRecords: 1,
        filterByFormula: `{username} = "${username}"`,
      })
      .firstPage();
    
    if (records.length > 0) {
      return {
        id: records[0].id,
        ...records[0].fields,
      };
    }
    return null;

  } catch (error) {
    console.error('Error finding user in Airtable:', error);
    throw new Error('Could not connect to the user database.');
  }
};
