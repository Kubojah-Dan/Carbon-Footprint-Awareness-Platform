import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { BigQuery } from '@google-cloud/bigquery';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'earthprint_analytics';
const TABLE_ID = process.env.BIGQUERY_TABLE_EMISSIONS || 'user_emissions';
const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || 'earthprint-cc1a7';

// Lazy initialize BigQuery client
let bigquery: BigQuery | null = null;
function getBigQueryClient() {
  if (!bigquery) {
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

    bigquery = new BigQuery({
      projectId: PROJECT_ID,
      credentials,
    });
  }
  return bigquery;
}

/**
 * Firestore Trigger: Streams newly created carbon logs to Google BigQuery.
 * Path: users/{uid}/logs/{logId}
 */
export const onLogCreatedStreamToBigQuery = onDocumentCreated(
  {
    document: 'users/{uid}/logs/{logId}',
    region: 'us-central1', // matches standard firebase region
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with this event.');
      return;
    }

    const data = snap.data();
    const uid = event.params.uid;
    const logId = event.params.logId;

    console.log(`[BigQuery Pipeline] New log created: ${logId} for user: ${uid}. Preparing stream...`);

    const row = {
      id: logId,
      uid: uid,
      category: data.category || 'all',
      kgCo2e: Number(data.kgCo2e || 0),
      loggedAt: data.loggedAt || new Date().toISOString(),
      activityDate: data.activityDate || new Date().toISOString().split('T')[0]!,
      source: data.source || 'manual',
      notes: data.notes || '',
    };

    try {
      const bq = getBigQueryClient();
      await bq
        .dataset(DATASET_ID)
        .table(TABLE_ID)
        .insert([row]);
      
      console.log(`[BigQuery Pipeline] Successfully streamed log ${logId} to BigQuery.`);
    } catch (err: any) {
      console.warn(`[BigQuery Pipeline] Failed to stream log ${logId} to BigQuery.`);
      console.warn(`Reason: ${err.message}`);
      console.warn('Logging payload locally:', JSON.stringify(row));
    }
  }
);
