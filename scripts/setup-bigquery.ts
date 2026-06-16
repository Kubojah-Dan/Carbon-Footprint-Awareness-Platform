import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'earthprint_analytics';
const TABLE_ID = process.env.BIGQUERY_TABLE_EMISSIONS || 'user_emissions';
const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || 'earthprint-cc1a7';

const schema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'uid', type: 'STRING', mode: 'REQUIRED' },
  { name: 'category', type: 'STRING', mode: 'REQUIRED' },
  { name: 'kgCo2e', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'loggedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'activityDate', type: 'DATE', mode: 'REQUIRED' },
  { name: 'source', type: 'STRING', mode: 'NULLABLE' },
  { name: 'notes', type: 'STRING', mode: 'NULLABLE' },
];

async function setupBigQuery() {
  console.log('===================================================');
  console.log('EarthPrint BigQuery Dataset & Table Schema Initializer');
  console.log('===================================================\n');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Dataset: ${DATASET_ID}`);
  console.log(`Table: ${TABLE_ID}\n`);

  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  }

  const credentials = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey)
    ? { client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, private_key: privateKey }
    : undefined;

  try {
    const bigquery = new BigQuery({
      projectId: PROJECT_ID,
      credentials,
    });

    // 1. Create dataset if not exists
    console.log(`Checking if dataset "${DATASET_ID}" exists...`);
    const [datasets] = await bigquery.getDatasets();
    const datasetExists = datasets.some((d) => d.id === DATASET_ID);

    if (!datasetExists) {
      console.log(`Dataset "${DATASET_ID}" not found. Creating...`);
      await bigquery.createDataset(DATASET_ID, { location: 'US' });
      console.log(`✅ Dataset "${DATASET_ID}" created successfully.`);
    } else {
      console.log(`✅ Dataset "${DATASET_ID}" already exists.`);
    }

    // 2. Create table if not exists
    console.log(`Checking if table "${TABLE_ID}" exists...`);
    const dataset = bigquery.dataset(DATASET_ID);
    const [tables] = await dataset.getTables();
    const tableExists = tables.some((t) => t.id === TABLE_ID);

    if (!tableExists) {
      console.log(`Table "${TABLE_ID}" not found. Creating...`);
      const options = {
        schema: { fields: schema },
        timePartitioning: {
          type: 'DAY',
          field: 'activityDate',
        },
      };

      await dataset.createTable(TABLE_ID, options);
      console.log(`✅ Table "${TABLE_ID}" created successfully with time partitioning.`);
    } else {
      console.log(`✅ Table "${TABLE_ID}" already exists.`);
    }

    console.log('\n🎉 BigQuery setup completed successfully!');
  } catch (err: any) {
    console.warn('\n⚠️ BigQuery setup failed or returned an error.');
    console.warn(`Reason: ${err.message}`);
    console.warn('Dry-run / Fallback mode will be used in Cloud Functions.');
  }
}

setupBigQuery();
