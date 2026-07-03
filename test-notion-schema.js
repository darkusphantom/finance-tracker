const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function check() {
  try {
    const db = await notion.databases.retrieve({ database_id: process.env.NOTION_TRANSACTIONS_DB });
    console.log("Transactions DB Properties:");
    console.log(Object.keys(db.properties));
  } catch (e) {
    console.error(e);
  }
}
check();
