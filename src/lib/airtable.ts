'use server';

import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableId = process.env.AIRTABLE_USERS_TABLE_ID;


if (!apiKey || !baseId || !tableId) {
  throw new Error('Airtable configuration is not defined in the environment variables.');
}

const base = new Airtable({ apiKey }).base(baseId);

export const findUserByUsernameOrEmail = async (loginIdentifier: string) => {
  try {
    const records = await base(tableId)
      .select({
        maxRecords: 1,
        filterByFormula: `OR({Username} = "${loginIdentifier}", {Email} = "${loginIdentifier}")`,
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

export const createUser = async (userData: {email: string, username: string, password: string})=> {
  try {
    const newRecord = await base(tableId).create([
      {
        fields: {
          Email: userData.email,
          Username: userData.username,
          Password: userData.password,
        }
      }
    ]);
    return newRecord;
  } catch (error) {
     console.error('Error creating user in Airtable:', error);
     throw new Error('Could not create user account.');
  }
};
