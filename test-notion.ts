import { Client } from '@notionhq/client';
import { config } from 'dotenv';
config({ path: '.env' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function test() {
  const dbId = process.env.NOTION_TRANSACTIONS_DB;
  if (!dbId) {
    console.error('No NOTION_TRANSACTIONS_DB found');
    return;
  }
  try {
    const res = await notion.databases.query({
      database_id: dbId,
      page_size: 1,
    });
    if (res.results.length === 0) {
      console.log('No transactions found.');
    } else {
      const props = (res.results[0] as any).properties;
      console.log('--- Transactions DB Properties ---');
      console.log(Object.keys(props));
      if (props.Account) {
        console.log('Account property details:');
        console.log(JSON.stringify(props.Account, null, 2));
      } else {
        console.log('Account property NOT found in Transactions DB.');
      }
    }

    const incomeDbId = process.env.NOTION_INCOME_DB;
    if (incomeDbId) {
        const resIncome = await notion.databases.query({
            database_id: incomeDbId,
            page_size: 1,
        });
        if (resIncome.results.length > 0) {
            const propsIncome = (resIncome.results[0] as any).properties;
            console.log('\n--- Income DB Properties ---');
            console.log(Object.keys(propsIncome));
            if (propsIncome.Account) {
                console.log('Account property details in Income DB:');
                console.log(JSON.stringify(propsIncome.Account, null, 2));
            } else {
                console.log('Account property NOT found in Income DB.');
            }
        }
    }
  } catch (error) {
    console.error('Error fetching from Notion:', error);
  }
}

test();
